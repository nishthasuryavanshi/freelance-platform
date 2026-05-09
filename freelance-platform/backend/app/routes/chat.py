from flask import Blueprint, request, jsonify
from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db, socketio
from app.models import Message, User

bp = Blueprint('chat', __name__, url_prefix='/api/chat')

@bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    try:
        current_user = get_jwt_identity()
        
        # Get unique conversation partners
        sent = db.session.query(Message.receiver_id).filter_by(sender_id=current_user['id']).distinct()
        received = db.session.query(Message.sender_id).filter_by(receiver_id=current_user['id']).distinct()
        
        partner_ids = set([r[0] for r in sent] + [r[0] for r in received])
        
        conversations = []
        for partner_id in partner_ids:
            user = User.query.get(partner_id)
            last_message = Message.query.filter(
                db.or_(
                    db.and_(Message.sender_id == current_user['id'], Message.receiver_id == partner_id),
                    db.and_(Message.sender_id == partner_id, Message.receiver_id == current_user['id'])
                )
            ).order_by(Message.timestamp.desc()).first()
            
            unread_count = Message.query.filter_by(
                sender_id=partner_id,
                receiver_id=current_user['id'],
                is_read=False
            ).count()
            
            conversations.append({
                'user_id': user.id,
                'email': user.email,
                'last_message': last_message.content if last_message else None,
                'timestamp': last_message.timestamp.isoformat() if last_message else None,
                'unread_count': unread_count
            })
        
        return jsonify(conversations), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/messages/<int:user_id>', methods=['GET'])
@jwt_required()
def get_messages(user_id):
    try:
        current_user = get_jwt_identity()
        
        messages = Message.query.filter(
            db.or_(
                db.and_(Message.sender_id == current_user['id'], Message.receiver_id == user_id),
                db.and_(Message.sender_id == user_id, Message.receiver_id == current_user['id'])
            )
        ).order_by(Message.timestamp.asc()).all()
        
        # Mark as read
        Message.query.filter_by(sender_id=user_id, receiver_id=current_user['id']).update({'is_read': True})
        db.session.commit()
        
        return jsonify([{
            'id': m.id,
            'sender_id': m.sender_id,
            'receiver_id': m.receiver_id,
            'content': m.content,
            'timestamp': m.timestamp.isoformat(),
            'is_read': m.is_read
        } for m in messages]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/messages', methods=['POST'])
@jwt_required()
def send_message():
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        
        message = Message(
            sender_id=current_user['id'],
            receiver_id=data['receiver_id'],
            content=data['content'],
            project_id=data.get('project_id')
        )
        
        db.session.add(message)
        db.session.commit()
        
        return jsonify({
            'id': message.id,
            'message': 'Message sent successfully'
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# WebSocket events
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('join')
def on_join(data):
    room = data['room']
    join_room(room)
    emit('status', {'msg': f'User joined room {room}'}, room=room)

@socketio.on('leave')
def on_leave(data):
    room = data['room']
    leave_room(room)
    emit('status', {'msg': f'User left room {room}'}, room=room)

@socketio.on('send_message')
def handle_message(data):
    try:
        message = Message(
            sender_id=data['sender_id'],
            receiver_id=data['receiver_id'],
            content=data['content'],
            project_id=data.get('project_id')
        )
        db.session.add(message)
        db.session.commit()
        
        room = f"chat_{min(data['sender_id'], data['receiver_id'])}_{max(data['sender_id'], data['receiver_id'])}"
        
        emit('receive_message', {
            'id': message.id,
            'sender_id': message.sender_id,
            'receiver_id': message.receiver_id,
            'content': message.content,
            'timestamp': message.timestamp.isoformat()
        }, room=room)
    except Exception as e:
        print(f'Error sending message: {str(e)}')
        emit('error', {'msg': str(e)})

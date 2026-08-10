import { Router } from 'express';
import messagingController from '../controllers/messaging.controller.js';

const router: Router = Router();

router.post('/conversations', messagingController.createConversation);
router.get('/conversations/enhanced', messagingController.getConversationsWithLastMessage);
router.get('/conversations/between/:participantOne/:participantTwo', messagingController.findConversationByParticipants);
router.get('/conversations/:id', messagingController.getConversationById);
router.delete('/conversations/:id', messagingController.deleteConversation);
router.patch('/conversations/:id/mark-read', messagingController.markConversationAsRead);
router.get('/conversations', messagingController.getConversations);

router.post('/messages', messagingController.sendMessage);
router.get('/messages/between/:userOne/:userTwo', messagingController.getMessagesBetweenUsers);
router.get('/messages/:id', messagingController.getMessageById);
router.patch('/messages/:id/mark-read', messagingController.markMessageAsRead);
router.delete('/messages/:id', messagingController.deleteMessage);
router.get('/messages', messagingController.getMessages);

router.get('/users/:userId/unread-count', messagingController.getUnreadMessageCount);

export default router;

import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Patch,
  Body, 
  Param, 
  Query, 
  HttpCode,
  HttpStatus,
  Headers,
  BadRequestException
} from '@nestjs/common';
import { MessagingService } from './services/messaging.service';
import {
  CreateConversationDto,
  CreateMessageDto,
  GetConversationsDto,
  GetMessagesDto,
  PaginationQueryDto,
  ConversationResponseDto,
  MessageResponseDto,
  PaginatedConversationsDto,
  PaginatedMessagesDto,
  ConversationWithLastMessageDto
} from './dto';

@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  private getActorId(actorHeader?: string, actorQuery?: string): string {
    const actorId = actorHeader || actorQuery;
    if (!actorId) {
      throw new BadRequestException('actor user id is required');
    }
    return actorId;
  }

  /**
   * Create a new conversation
   */
  @Post('conversations')
  async createConversation(
    @Body() createConversationDto: CreateConversationDto
  ): Promise<ConversationResponseDto> {
    return await this.messagingService.createConversation(createConversationDto);
  }

  /**
   * Get conversations for a user
   */
  @Get('conversations')
  async getConversations(
    @Query() query: GetConversationsDto
  ): Promise<PaginatedConversationsDto> {
    return await this.messagingService.getConversations(query);
  }

  /**
   * Get conversations with last message and unread count
   */
  @Get('conversations/enhanced')
  async getConversationsWithLastMessage(
    @Query('userId') userId: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<ConversationWithLastMessageDto[]> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return await this.messagingService.getConversationsWithLastMessage(
      userId, 
      pagination.page || 1, 
      pagination.limit || 10
    );
  }

  /**
   * Get specific conversation by ID
   */
  @Get('conversations/:id')
  async getConversationById(
    @Param('id') id: string
  ): Promise<ConversationResponseDto> {
    return await this.messagingService.findConversationById(id);
  }

  /**
   * Find conversation between two participants
   */
  @Get('conversations/between/:participantOne/:participantTwo')
  async findConversationByParticipants(
    @Param('participantOne') participantOne: string,
    @Param('participantTwo') participantTwo: string
  ): Promise<ConversationResponseDto | null> {
    return await this.messagingService.findConversationByParticipants(participantOne, participantTwo);
  }

  /**
   * Delete a conversation
   */
  @Delete('conversations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConversation(
    @Param('id') conversationId: string,
    @Query('userId') userId: string,
    @Headers('x-user-id') actorHeader?: string
  ): Promise<void> {
    await this.messagingService.deleteConversation(conversationId, this.getActorId(actorHeader, userId));
  }

  /**
   * Mark all messages in a conversation as read
   */
  @Patch('conversations/:id/mark-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markConversationAsRead(
    @Param('id') conversationId: string,
    @Query('userId') userId: string,
    @Headers('x-user-id') actorHeader?: string
  ): Promise<void> {
    await this.messagingService.markConversationAsRead(conversationId, this.getActorId(actorHeader, userId));
  }

  /**
   * Send a new message
   */
  @Post('messages')
  async sendMessage(
    @Body() createMessageDto: CreateMessageDto
  ): Promise<MessageResponseDto> {
    return await this.messagingService.sendMessage(createMessageDto);
  }

  /**
   * Get messages in a conversation
   */
  @Get('messages')
  async getMessages(
    @Query() query: GetMessagesDto
  ): Promise<PaginatedMessagesDto> {
    return await this.messagingService.getMessages(query);
  }

  /**
   * Get messages between two users
   */
  @Get('messages/between/:userOne/:userTwo')
  async getMessagesBetweenUsers(
    @Param('userOne') userOne: string,
    @Param('userTwo') userTwo: string,
    @Query() pagination: PaginationQueryDto
  ): Promise<PaginatedMessagesDto> {
    return await this.messagingService.getMessagesBetweenUsers(
      userOne, 
      userTwo, 
      pagination.page || 1, 
      pagination.limit || 50
    );
  }

  /**
   * Get specific message by ID
   */
  @Get('messages/:id')
  async getMessageById(
    @Param('id') messageId: string
  ): Promise<MessageResponseDto> {
    return await this.messagingService.getMessageById(messageId);
  }

  /**
   * Mark a message as read
   */
  @Patch('messages/:id/mark-read')
  async markMessageAsRead(
    @Param('id') messageId: string,
    @Query('userId') userId: string,
    @Headers('x-user-id') actorHeader?: string
  ): Promise<MessageResponseDto> {
    return await this.messagingService.markMessageAsRead(messageId, this.getActorId(actorHeader, userId));
  }

  /**
   * Delete a specific message
   */
  @Delete('messages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessage(
    @Param('id') messageId: string,
    @Query('userId') userId: string,
    @Headers('x-user-id') actorHeader?: string
  ): Promise<void> {
    await this.messagingService.deleteMessage(messageId, this.getActorId(actorHeader, userId));
  }

  /**
   * Get unread message count for a user
   */
  @Get('users/:userId/unread-count')
  async getUnreadMessageCount(
    @Param('userId') userId: string,
    @Headers('x-user-id') actorHeader?: string
  ): Promise<{ count: number }> {
    const count = await this.messagingService.getUnreadMessageCount(this.getActorId(actorHeader, userId));
    return { count };
  }
}

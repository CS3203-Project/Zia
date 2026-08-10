import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { MessagingGateway } from '../messeging/messaging.gateway';
import { BroadcastConfirmationDto } from './dto/broadcast-confirmation.dto';

@Controller('api/confirmation')
export class ConfirmationBroadcastController {
  constructor(private readonly messagingGateway: MessagingGateway) {}

  @Post('broadcast')
  broadcastConfirmation(
    @Body() body: BroadcastConfirmationDto,
    @Headers('x-internal-api-key') apiKey?: string,
  ) {
    const expectedKey = process.env.INTERNAL_API_KEY;
    if (!expectedKey || !apiKey || apiKey !== expectedKey) {
      throw new UnauthorizedException('Invalid internal API key');
    }

    const { conversationId, confirmation } = body;
    this.messagingGateway.broadcastConfirmationUpdate(conversationId, confirmation);
    return { success: true };
  }
}

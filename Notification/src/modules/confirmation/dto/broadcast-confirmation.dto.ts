import { IsObject, IsString, Matches } from 'class-validator';

export class BroadcastConfirmationDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'conversationId must be a valid ID format' })
  conversationId: string;

  @IsObject()
  confirmation: Record<string, unknown>;
}

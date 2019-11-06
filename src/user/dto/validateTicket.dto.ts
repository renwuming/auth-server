import { IsDefined } from 'class-validator';
export class validateTicketDto {
  @IsDefined()
  readonly ticket: string;
}

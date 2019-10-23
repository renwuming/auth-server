import { IsUrl, IsDefined } from 'class-validator';
export class validateCodeDto {
  @IsDefined()
  readonly code: string;
  @IsDefined()
  readonly state: string;
  @IsUrl()
  readonly redirect: string;
}

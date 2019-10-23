import { IsUrl } from 'class-validator';
export class getLoginUrlDto {
  @IsUrl()
  readonly redirect: string;
}

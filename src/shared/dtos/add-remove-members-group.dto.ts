import { IsArray, IsNotEmpty } from 'class-validator';

export class AddRemoveMembersGroupDto {
  @IsNotEmpty()
  room: string;
  @IsArray()
  members: string[];
}

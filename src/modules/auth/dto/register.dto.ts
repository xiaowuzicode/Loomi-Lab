import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsString({ message: '用户名必须是字符串' })
  @MinLength(2, { message: '用户名长度至少为2位' })
  username: string;

  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度至少为6位' })
  password: string;

  @IsOptional()
  @IsEnum(UserRole, { message: '用户角色不正确' })
  role?: UserRole;

  @IsOptional()
  @IsString()
  phone?: string;
}

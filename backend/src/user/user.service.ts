import { Inject, Injectable } from '@nestjs/common';
import PROVIDERS from '../constants/providers';
import { User } from './user.entity';
import { MailerService } from '@nest-modules/mailer';
import { SignUpDto } from '../auth/auth.docs';
import * as bcrypt from 'bcrypt';
import { IResetPassword } from 'src/interfaces/user.interface';

@Injectable()
export class UserService {
  constructor(
    @Inject(PROVIDERS.USER)
    private readonly USER_REPOSITORY: typeof User,
    private readonly mailerService: MailerService,
  ) {}

  getAllUsers = async () => {
    return this.USER_REPOSITORY.findAll<User>();
  };

  createNewUser = async (data: SignUpDto) => {
    return this.USER_REPOSITORY.create(data);
  };

  findByEmail = async (email: string) => {
    return this.USER_REPOSITORY.findOne({
      where: {
        email: email,
      },
    });
  };

  resetToken = (email: string): string => {
    return bcrypt.hashSync(email, 10);
  };

  async forgotPassword(email: string): Promise<IResetPassword> {
    try {
      const resetToken = this.resetToken(email);
      this.mailerService.sendMail({
        to: email,
        from: 'adnanahmic203@gmail.com',
        subject: 'Reset password ✔', // Subject line
        text: `Reset your password: http://localhost:3000/reset-password/${resetToken}`,
        html: `<b>Reset your password:</b> <a href="http://localhost:3000/reset-password/${resetToken}" > here </a> `,
      });
      return this.updateResetToken(resetToken, email);
    } catch (error) {
      return {
        message: 'Error occurred while sending email',
        status: 500,
      };
    }
  }

  updateResetToken = async (
    token: string,
    email: string,
  ): Promise<IResetPassword> => {
    const user = await this.findByEmail(email);
    if (user) {
      user.resetToken = token;
      user.save();

      return {
        message: 'Reset link will be sent to your email',
        status: 200,
        resetToken: token,
      };
    }
    return {
      message: 'Email does not exist',
      status: 400,
    };
  };

  async resetPassword(
    password: string,
    resetToken: string,
  ): Promise<IResetPassword> {
    try {
      const user = await this.USER_REPOSITORY.findOne({
        where: {
          resetToken: resetToken,
        },
      });
      user.password = bcrypt.hashSync(password, 10);
      user.resetToken = null;
      user.save();
      return {
        message: 'Password changed',
        status: 200,
      };
    } catch (error) {
      return {
        message: 'Error occurred while changing password',
        status: 500,
      };
    }
  }
}

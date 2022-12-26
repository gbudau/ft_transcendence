import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Role } from '../shared/enums/role.enum';
import { ChatroomMemberWithAuthorization } from './infrastructure/db/chatroom-member-with-authorization.entity';
import { UserToRole } from './infrastructure/db/user-to-role.entity';
import { IUserToRoleRepository } from './infrastructure/db/user-to-role.repository';
import { UserWithAuthorization } from './infrastructure/db/user-with-authorization.entity';
import { IChatroomMemberRepository } from '../chat/chatroom/chatroom-member/infrastructure/db/chatroom-member.repository';
import { UserWithAuthorizationResponseDto } from './dto/user-with-authorization.response.dto';
import { IUserRepository } from '../user/infrastructure/db/user.repository';
import { CaslAbilityFactory } from './casl-ability.factory';
import { Action } from '../shared/enums/action.enum';

@Injectable()
export class AuthorizationService {
  constructor(
    private chatroomMemberRepository: IChatroomMemberRepository,
    private userToRoleRepository: IUserToRoleRepository,
    private userRepository: IUserRepository,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async getUserWithAuthorizationFromUsername(
    username: string,
  ): Promise<UserWithAuthorization> {
    const userWithRoles =
      await this.userToRoleRepository.getUserWithAuthorization(username, false);
    if (!userWithRoles) {
      throw new NotFoundException();
    }
    return userWithRoles;
  }

  async getUserWithAuthorizationFromId(
    id: string,
  ): Promise<UserWithAuthorization> {
    const userWithRoles =
      await this.userToRoleRepository.getUserWithAuthorization(id, true);
    if (!userWithRoles) {
      throw new NotFoundException();
    }
    return userWithRoles;
  }

  async addUserToRole(user: UserToRole): Promise<UserToRole> {
    const userToRole = await this.userToRoleRepository.addUserToRole(
      user.id,
      user.role,
      true,
    );
    if (!userToRole) {
      throw new UnprocessableEntityException();
    }
    return userToRole;
  }

  async addUserToRoleFromUsername(
    username: string,
    role: Role,
  ): Promise<UserToRole> {
    const userToRole = await this.userToRoleRepository.addUserToRole(
      username,
      role,
      false,
    );
    if (!userToRole) {
      throw new NotFoundException();
    }
    return userToRole;
  }

  async deleteUserToRole(user: UserToRole): Promise<UserToRole> {
    const userToRole = await this.userToRoleRepository.deleteUserToRole(
      user.id,
      user.role,
      true,
    );
    if (!userToRole) {
      throw new NotFoundException();
    }
    return userToRole;
  }

  async deleteUserToRoleFromUsername(
    username: string,
    role: Role,
  ): Promise<UserToRole> {
    const userToRole = await this.userToRoleRepository.deleteUserToRole(
      username,
      role,
      false,
    );
    if (!userToRole) {
      throw new NotFoundException();
    }
    return userToRole;
  }

  async getUserAuthContextForChatroom(
    userId: string,
    chatId: string,
  ): Promise<ChatroomMemberWithAuthorization> {
    const g_user = await this.getUserWithAuthorizationFromId(userId);
    const crm = await this.chatroomMemberRepository.getById(chatId, userId);
    return new ChatroomMemberWithAuthorization({
      ...g_user,
      chatId,
      crm_member: !!crm,
      crm_owner: crm?.owner,
      crm_admin: crm?.admin,
      crm_banned: crm?.banned,
      cr_muted: crm?.muted,
    });
  }

  async getUserWithAuthorizationResponseDtoFromUsername(
    destUsername: string,
    authUser: UserWithAuthorization,
  ): Promise<UserWithAuthorizationResponseDto> {
    const destUser = await this.userRepository.getByUsername(destUsername);
    if (!destUser) {
      throw new NotFoundException();
    }
    const { g_owner, g_admin, g_banned } =
      await this.getUserWithAuthorizationFromUsername(destUsername);
    const ret = new UserWithAuthorizationResponseDto({
      g_admin,
      g_owner,
      g_banned,
      ...destUser,
    });
    const ability = await this.caslAbilityFactory.defineAbilitiesFor(authUser);
    if (ability.cannot(Action.Read, ret)) {
      throw new ForbiddenException();
    }
    return ret;
  }
}

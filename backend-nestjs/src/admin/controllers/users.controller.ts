import {
  Controller,
  Get,
  Put,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from '../admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@ApiTags('Admin - Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'List all users with pagination and search' })
  async getUsers(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('adminsOnly') adminsOnly: string,
  ) {
    return this.adminService.getUsers(
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 50,
      search,
      adminsOnly === 'true',
    );
  }

  @Put(':id/role')
  @ApiOperation({ summary: 'Update user role (admin/campus/company)' })
  async updateUserRole(@Param('id') id: string, @Body() body: any) {
    const user = await this.adminService.updateUserRole(id, body);
    return { success: true, user };
  }

  @Get(':id/report')
  @ApiOperation({ summary: 'Get candidate report' })
  async getReport(@Param('id') id: string) {
    return this.adminService.getReport(id);
  }

  @Put(':id/promote')
  @ApiOperation({ summary: 'Promote user to admin' })
  async promoteUser(@Param('id') id: string) {
    const user = await this.adminService.updateUserRole(id, { 
      isAdmin: true, 
      'profile.role': 'admin' 
    });
    return {
      success: true,
      message: `${user.email} is now an admin`,
      user,
    };
  }

  @Put(':id/demote')
  @ApiOperation({ summary: 'Demote user from admin' })
  async demoteUser(@Param('id') id: string) {
    const user = await this.adminService.updateUserRole(id, { 
      isAdmin: false, 
      'profile.role': 'student' 
    });
    return {
      success: true,
      message: `${user.email} is no longer an admin`,
      user,
    };
  }
}

import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/authorization.middleware';
import { getRouteParam } from '../utils/route-param';

const router = express.Router();

// Get all users (Admin & Superadmin only)
router.get('/', authenticateToken, requireRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new Staff/User account (Admin & Superadmin only)
router.post('/', authenticateToken, requireRoles('admin', 'superadmin'), async (req: AuthRequest, res) => {
  try {
    const { username, password, role = 'staff' } = req.body;
    const caller = req.user;

    // Validate username
    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ message: 'Tên đăng nhập là bắt buộc' });
    }
    const cleanUsername = username.trim();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({ message: 'Tên đăng nhập phải từ 3 đến 30 ký tự' });
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      return res.status(400).json({ message: 'Tên đăng nhập chỉ được chứa chữ cái, số, gạch dưới hoặc gạch nối' });
    }

    // Validate password
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Validate role permissions
    // Admin can ONLY create role 'staff'
    // Superadmin can create 'staff' or 'admin', but NEVER another 'superadmin'
    let targetRole = 'staff';
    if (role === 'admin') {
      if (caller?.role !== 'superadmin') {
        return res.status(403).json({ message: 'Chỉ Superadmin mới có quyền tạo tài khoản Admin' });
      }
      targetRole = 'admin';
    } else if (role === 'superadmin') {
      return res.status(403).json({ message: 'Không thể tạo thêm tài khoản Superadmin qua API' });
    } else {
      targetRole = 'staff';
    }

    // Check if username already exists
    const existing = await prisma.user.findUnique({
      where: { username: cleanUsername }
    });
    if (existing) {
      return res.status(409).json({ message: 'Tên đăng nhập đã được sử dụng' });
    }

    // Hash password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        password: hashedPassword,
        role: targetRole,
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.status(201).json({
      message: 'Tạo tài khoản nhân viên thành công',
      user: newUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo người dùng' });
  }
});

// Update Staff/User account (Admin & Superadmin only)
router.put('/:id', authenticateToken, requireRoles('admin', 'superadmin'), async (req: AuthRequest, res) => {
  try {
    const id = getRouteParam(req.params.id);
    const caller = req.user;
    const { username, password, role } = req.body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Protect Superadmin accounts from unauthorized changes
    if (targetUser.role === 'superadmin' && caller?.role !== 'superadmin') {
      return res.status(403).json({ message: 'Không có quyền chỉnh sửa tài khoản Superadmin' });
    }

    // Non-superadmin cannot edit admin accounts
    if (targetUser.role === 'admin' && caller?.role !== 'superadmin' && caller?.id !== targetUser.id) {
      return res.status(403).json({ message: 'Chỉ Superadmin mới có quyền chỉnh sửa tài khoản Admin khác' });
    }

    const dataToUpdate: any = {};

    // Username change
    if (username && typeof username === 'string' && username.trim() !== targetUser.username) {
      const cleanUsername = username.trim();
      if (cleanUsername.length < 3 || cleanUsername.length > 30) {
        return res.status(400).json({ message: 'Tên đăng nhập phải từ 3 đến 30 ký tự' });
      }
      const existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
      if (existing) {
        return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại' });
      }
      dataToUpdate.username = cleanUsername;
    }

    // Password reset/update
    if (password && typeof password === 'string') {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
      }
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password = await bcrypt.hash(password, salt);
    }

    // Role change (if requested)
    if (role && role !== targetUser.role) {
      if (role === 'superadmin') {
        return res.status(403).json({ message: 'Không thể nâng quyền thành Superadmin' });
      }
      if (caller?.role !== 'superadmin') {
        return res.status(403).json({ message: 'Chỉ Superadmin mới có quyền thay đổi vai trò người dùng' });
      }
      dataToUpdate.role = role;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ message: 'Không có thông tin nào để cập nhật' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.json({
      message: 'Cập nhật tài khoản thành công',
      user: updated
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật người dùng' });
  }
});

// Delete Staff/User account (Admin & Superadmin only)
router.delete('/:id', authenticateToken, requireRoles('admin', 'superadmin'), async (req: AuthRequest, res) => {
  try {
    const id = getRouteParam(req.params.id);
    const caller = req.user;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Protection: Cannot delete yourself
    if (caller?.id === id) {
      return res.status(400).json({ message: 'Không thể tự xóa tài khoản của chính mình' });
    }

    // Protection: Cannot delete Superadmin
    if (targetUser.role === 'superadmin') {
      return res.status(403).json({ message: 'Không thể xóa tài khoản Superadmin' });
    }

    // Protection: Admin cannot delete another Admin
    if (targetUser.role === 'admin' && caller?.role !== 'superadmin') {
      return res.status(403).json({ message: 'Chỉ Superadmin mới có quyền xóa tài khoản Admin' });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ message: 'Đã xóa tài khoản thành công' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa người dùng' });
  }
});

export default router;

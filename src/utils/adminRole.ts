/** 平台管理员角色码，与后端 {@code UserRole.ADMIN} 一致。 */
export const ADMIN_ROLE = 1

export function isAdminUser(role?: number | null): boolean {
  return role === ADMIN_ROLE
}

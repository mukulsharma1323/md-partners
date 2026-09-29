export function can(user, resource, action = 'view') {
  return user?.role === 'super-admin' || !!user?.permissions?.[resource]?.[action];
}

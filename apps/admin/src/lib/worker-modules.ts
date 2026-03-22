// Modules that workers can potentially access (admin-only modules are always hidden from this list)
export const WORKER_MODULES = [
	{ href: '/dashboard',  label: 'Dashboard',   icon: 'grid' },
	{ href: '/productos',  label: 'Productos',    icon: 'package' },
	{ href: '/categorias', label: 'Categorías',   icon: 'tag' },
	{ href: '/facturas',   label: 'Facturas',     icon: 'file-text' },
	{ href: '/inventario', label: 'Inventario',   icon: 'clipboard-list' },
	{ href: '/ventas',     label: 'Ventas',       icon: 'shopping-bag' },
	{ href: '/clientes',   label: 'Clientes',     icon: 'users' },
] as const;

export type WorkerModule = typeof WORKER_MODULES[number];

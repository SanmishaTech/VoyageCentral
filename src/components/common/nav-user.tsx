'use client';

import React from 'react';
import { LogOut, UserPen, ChevronsUpDown } from 'lucide-react';
import ConfirmDialog from '@/components/common/confirm-dialog';
import { useNavigate } from 'react-router-dom';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@/components/ui/sidebar';

export function NavUser({
	user,
}: {
	user: {
		name: string;
		email: string;
		avatar: string;
		avatarName: string;
	};
}) {
	const { isMobile } = useSidebar();
	const navigate = useNavigate();

	const handleLogout = () => {
		localStorage.removeItem('authToken'); // Remove auth token
		localStorage.removeItem('user'); // Remove user data
		navigate('/'); // Redirect to login page
	};

	return (
		<>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size='lg'
								className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer'
							>
								<Avatar className='h-8 w-8 rounded-lg'>
									<AvatarImage src={user.avatar} alt={user.name} />
									<AvatarFallback className='rounded-lg'>
										{user.avatarName}
									</AvatarFallback>
								</Avatar>
								<div className='grid flex-1 text-left text-sm leading-tight'>
									<span className='truncate font-semibold'>{user.name}</span>
									<span className='truncate text-xs'>{user.email}</span>
								</div>
								<ChevronsUpDown className='ml-auto size-4' />
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
							side={isMobile ? 'bottom' : 'right'}
							align='end'
							sideOffset={4}
						>
							<DropdownMenuLabel className='p-0 font-normal'>
								<div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
									<Avatar className='h-8 w-8 rounded-lg'>
										<AvatarImage src={user.avatar} alt={user.name} />
										<AvatarFallback className='rounded-lg'>
											{user.avatarName}
										</AvatarFallback>
									</Avatar>
									<div className='grid flex-1 text-left text-sm leading-tight'>
										<span className='truncate font-semibold'>{user.name}</span>
										<span className='truncate text-xs'>{user.email}</span>
									</div>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem
									onClick={() => navigate('/profile')}
									className='cursor-pointer'
								>
									<UserPen className='mr-2 h-4 w-4' />
									Update Profile
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<ConfirmDialog
								title='Are you sure you want to Log out?'
								description='This action cannot be undone.'
								confirmLabel='Log out'
								cancelLabel='Cancel'
								onConfirm={handleLogout} // Perform logout
							>
								<DropdownMenuItem
									onSelect={(e) => e.preventDefault()} // Prevent DropdownMenu from closing
								>
									<div className='flex items-center gap-2'>
										<LogOut className='mr-2 h-4 w-4' />
										<span>Log out</span>
									</div>
								</DropdownMenuItem>
							</ConfirmDialog>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		</>
	);
}

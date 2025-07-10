'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import Icon, { IconName } from '@/components/shared/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

const navItems = [
    { href: '/design-studio', name: 'Design Studio', icon: 'Brush' as IconName },
    { href: '/dashboard', name: 'My Designs', icon: 'LayoutGrid' as IconName },
    { href: '/inspiration-gallery', name: 'Inspiration', icon: 'Sparkles' as IconName },
    { href: '/live-share', name: 'Live Share', icon: 'Users' as IconName },
    { href: '/leaderboard', name: 'Leaderboard', icon: 'Trophy' as IconName },
    { href: '/settings', name: 'Settings', icon: 'Settings' as IconName },
];

const adminNavItems = [
    { href: '/admin', name: 'Admin Center', icon: 'ShieldCheck' as IconName },
];

const SidebarContent = () => {
  const pathname = usePathname();
  const { user, isAdmin } = useApp();
  const allNavItems = isAdmin ? [...navItems, ...adminNavItems] : navItems;

  return (
    <>
      <div className="flex items-center space-x-3 mb-10 px-2">
        <motion.div
          className="w-10 h-10 bg-gradient-to-br from-primary to-violet-600 rounded-lg flex items-center justify-center shadow-lg"
          whileHover={{ scale: 1.1, rotate: 10 }}
        >
          <Icon name="Wand2" className="w-6 h-6 text-white" />
        </motion.div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">SurfaceStory</h1>
      </div>
      <nav className="flex-grow">
        <ul>
          {allNavItems.map(item => (
            <li key={item.href}>
              <Link href={item.href} passHref>
                <motion.div
                  className={`flex items-center space-x-3 px-4 py-3 my-1 rounded-lg font-semibold transition-all duration-200 group ${
                    pathname === item.href
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
                  }`}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Icon name={item.icon} className={`w-5 h-5 transition-transform duration-200 ${pathname !== item.href && 'group-hover:scale-110'}`} />
                  <span>{item.name}</span>
                </motion.div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {user && (
        <div className="mt-auto flex items-center space-x-3 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
          <Avatar>
             <AvatarImage src={`https://i.pravatar.cc/40?u=${user.uid}`} alt="User Avatar" />
             <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm">Creative User {isAdmin && '(Admin)'}</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{user.uid}</p>
          </div>
        </div>
      )}
    </>
  )
}

const Sidebar = () => {
  return (
    <>
      <aside className="w-64 bg-black/10 dark:bg-gray-900/50 backdrop-blur-xl border-r border-white/10 flex-col p-4 hidden md:flex">
        <SidebarContent />
      </aside>
      <div className="md:hidden p-4 absolute top-0 left-0 z-10">
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Icon name="Menu" className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-gray-900/80 backdrop-blur-xl border-r border-white/10 p-4 flex flex-col">
              <SidebarContent />
            </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default Sidebar;

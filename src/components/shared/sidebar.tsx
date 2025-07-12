
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
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { getAuth, signOut } from 'firebase/auth';


const navItems = [
    { href: '/design-studio', name: 'Design Studio', icon: 'Brush' as IconName },
    { href: '/dashboard', name: 'My Designs', icon: 'LayoutGrid' as IconName },
    { href: '/inspiration-gallery', name: 'Inspiration', icon: 'Sparkles' as IconName },
    { href: '/prompt-enhancer', name: 'Prompt Enhancer', icon: 'HelpCircle' as IconName },
    { href: '/live-share', name: 'Live Share', icon: 'Users' as IconName },
    { href: '/leaderboard', name: 'Leaderboard', icon: 'Trophy' as IconName },
];

const bottomNavItems = [
    { href: '/settings', name: 'Creator Admin', icon: 'Settings' as IconName },
]

const adminNavItems = [
    { href: '/super-admin', name: 'Super Admin', icon: 'ShieldCheck' as IconName },
];

const SidebarHeader = () => (
  <motion.div 
    className="flex items-center space-x-3 mb-10 px-2"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay: 0.1 }}
  >
    <motion.div
      className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg"
      whileHover={{ scale: 1.1, rotate: 10 }}
    >
      <Icon name="Wand2" className="w-6 h-6 text-white" />
    </motion.div>
    <h1 className="text-2xl font-bold font-headline text-foreground">SurfaceStory</h1>
  </motion.div>
);


const SidebarContent = () => {
  const pathname = usePathname();
  const { user, isAdmin, cart } = useApp();
  
  const allNavItems = isAdmin ? [...navItems, ...adminNavItems] : navItems;
  const allBottomNavItems = [...bottomNavItems];

  const cartItem = { href: '/checkout', name: 'Cart', icon: 'ShoppingCart' as IconName, count: cart.length };

  const handleSignOut = () => {
    // This won't work in bypass mode, but keep it for when it's re-enabled
    const auth = getAuth();
    signOut(auth);
  };


  const NavLink: React.FC<{ item: { href: string; name: string; icon: IconName, count?: number } }> = ({ item }) => (
      <Link href={item.href} passHref>
          <motion.div
              className={`flex items-center justify-between space-x-3 px-4 py-3 my-1 rounded-lg font-semibold transition-all duration-200 group ${pathname.startsWith(item.href)
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="flex items-center gap-3">
              <Icon name={item.icon} className={`w-5 h-5 transition-transform duration-200 ${!pathname.startsWith(item.href) && 'group-hover:scale-110'}`} />
              <span className="text-button font-normal">{item.name}</span>
            </div>
             {item.count !== undefined && item.count > 0 && (
                <Badge variant={pathname.startsWith(item.href) ? 'secondary' : 'default'} className="h-6 w-6 flex items-center justify-center p-0">{item.count}</Badge>
            )}
          </motion.div>
      </Link>
  );

  return (
    <>
      <SidebarHeader />
      <nav className="flex-grow flex flex-col">
        <ul className="flex-grow">
          {allNavItems.map((item) => (
            <motion.li 
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + (allNavItems.indexOf(item) * 0.05) }}
            >
              <NavLink item={item} />
            </motion.li>
          ))}
        </ul>
        <ul>
        <motion.li
             key={cartItem.href}
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.4, delay: 0.2 + (allNavItems.length * 0.05) }}
        >
             <NavLink item={cartItem} />
        </motion.li>
        {allBottomNavItems.map((item) => (
            <motion.li 
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + (allNavItems.length + allBottomNavItems.indexOf(item) * 0.05) }}
            >
              <NavLink item={item} />
            </motion.li>
          ))}
        </ul>
      </nav>
      <motion.div 
        className="mt-4 flex items-center space-x-3 p-2 rounded-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        {user ? (
          <>
             <Link href="/profile" passHref>
                <Avatar className="w-10 h-10 cursor-pointer">
                   <AvatarImage src={`https://i.pravatar.cc/40?u=${user.uid}`} alt="User Avatar" />
                   <AvatarFallback>{user.email ? user.email.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                </Avatar>
             </Link>
            <div className="flex-grow">
              <p className="font-semibold text-foreground text-sm truncate">{user.name || 'Creative User'} {isAdmin && <span className="text-xs text-primary">(Admin)</span>}</p>
              {user.uid.startsWith('mock-') ? (
                 <p className="text-xs text-muted-foreground">Login Bypassed</p>
              ) : (
                <button onClick={handleSignOut} className="text-xs text-muted-foreground hover:text-primary">Sign Out</button>
              )}
            </div>
          </>
        ) : (
           <Button asChild className="w-full">
            <Link href="/login">Sign In</Link>
           </Button>
        )}
      </motion.div>
    </>
  )
}

const Sidebar = () => {
    const isMobile = useIsMobile();
    
    if (isMobile) {
        return (
            <div className="p-4 fixed top-0 left-0 z-50">
              <Sheet>
                  <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                          <Icon name="Menu" className="h-6 w-6" />
                      </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 bg-background/90 backdrop-blur-xl border-r border-border/50 p-4 flex flex-col">
                    <SidebarContent />
                  </SheetContent>
              </Sheet>
            </div>
        );
    }
    
    return (
      <aside className="w-64 bg-background/80 backdrop-blur-xl border-r border-border/50 flex-col p-4 hidden md:flex">
        <SidebarContent />
      </aside>
    );
};

export default Sidebar;

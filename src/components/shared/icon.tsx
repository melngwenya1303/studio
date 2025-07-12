
import { Home, Zap, Brush, LayoutGrid, Settings, Star, Heart, Bot, Image as ImageIcon, Search, X, Sparkles, Wand2, Info, RefreshCcw, BookOpen, Laptop, Smartphone, Tablet, ShieldCheck, KeyRound, PlusCircle, Trash2, Users, Send, Trophy, Mic, Volume2, UserPlus, Menu, Box, Camera, List, Filter, Truck, PieChart, BarChart3, Undo2, ShoppingCart, Package, HelpCircle, Copy, CreditCard, UserCircle, Ban, Share2, Upload, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import type { FC } from 'react';

const icons = { Home, Zap, Brush, LayoutGrid, Settings, Star, Heart, Bot, ImageIcon, Search, X, Sparkles, Wand2, Info, RefreshCcw, BookOpen, Laptop, Smartphone, Tablet, ShieldCheck, KeyRound, PlusCircle, Trash2, Users, Send, Trophy, Mic, Volume2, UserPlus, Menu, Box, Camera, List, Filter, Truck, PieChart, BarChart3, Undo2, ShoppingCart, Package, HelpCircle, Copy, CreditCard, UserCircle, Ban, Share2, Upload, TrendingUp, ArrowUp, ArrowDown };

export type IconName = keyof typeof icons;

interface IconProps extends React.ComponentProps<typeof Home> {
    name: IconName;
}

const Icon: FC<IconProps> = ({ name, ...props }) => {
    const LucideIcon = icons[name];
    return LucideIcon ? <LucideIcon {...props} /> : null;
};

export default Icon;

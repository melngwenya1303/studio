import { Home, Zap, Brush, LayoutGrid, Settings, Star, Heart, Bot, Image as ImageIcon, Search, X, Sparkles, Wand2, Info, RefreshCcw, BookOpen, Laptop, Smartphone, Headphones, ShieldCheck, KeyRound, PlusCircle, Trash2, Users, Send, Trophy, Mic, Volume2, UserPlus, type LucideProps } from 'lucide-react';
import type { FC } from 'react';

const icons = { Home, Zap, Brush, LayoutGrid, Settings, Star, Heart, Bot, ImageIcon, Search, X, Sparkles, Wand2, Info, RefreshCcw, BookOpen, Laptop, Smartphone, Headphones, ShieldCheck, KeyRound, PlusCircle, Trash2, Users, Send, Trophy, Mic, Volume2, UserPlus };

export type IconName = keyof typeof icons;

interface IconProps extends LucideProps {
    name: IconName;
}

const Icon: FC<IconProps> = ({ name, ...props }) => {
    const LucideIcon = icons[name];
    return LucideIcon ? <LucideIcon {...props} /> : null;
};

export default Icon;

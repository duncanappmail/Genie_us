
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useProjects } from '../context/ProjectContext';
import { 
    SparklesIcon, SunIcon, MoonIcon, ArrowRightOnRectangleIcon, UserCircleIcon, 
    HomeIcon, CreditCardIcon, Squares2X2Icon, MagnifyingGlassIcon, Bars3Icon, XMarkIcon,
    DNAIcon, ChatBubbleLeftIcon
} from './icons';

interface HeaderProps {
    isInitialPlanSelection?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isInitialPlanSelection }) => {
    const { user, handleLogout } = useAuth();
    const { theme, setTheme, navigateTo, openUpgradeModal } = useUI();
    const { loadProjects } = useProjects();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;
    
    const onHome = () => {
        if (user) loadProjects(user.email);
        navigateTo('HOME');
        setIsMobileMenuOpen(false);
    };
    
    const onNavigate = (step: any) => {
        navigateTo(step);
        setIsMobileMenuOpen(false);
    }
    
    const onThemeChange = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
        setIsMenuOpen(false);
    }
    
    const onLogout = () => {
        handleLogout();
        setIsMobileMenuOpen(false);
    }

    const navLinks = [
        { label: 'Home', icon: <HomeIcon className="w-5 h-5" />, action: onHome },
        { label: 'Explore Templates', icon: <MagnifyingGlassIcon className="w-5 h-5" />, action: () => onNavigate('EXPLORE') },
        { label: 'All Projects', icon: <Squares2X2Icon className="w-5 h-5" />, action: () => onNavigate('ALL_PROJECTS') },
        { 
            label: 'Brand DNA', 
            icon: <DNAIcon className="w-5 h-5" />, 
            action: () => {
                if (user?.subscription?.plan === 'Starter') {
                    openUpgradeModal('Brand DNA');
                    setIsMobileMenuOpen(false);
                } else {
                    onNavigate('BRANDING');
                }
            } 
        },
        { label: 'Contact Support', icon: <ChatBubbleLeftIcon className="w-5 h-5" />, action: () => onNavigate('CONTACT_SUPPORT') },
        { label: 'My Account', icon: <UserCircleIcon className="w-5 h-5" />, action: () => onNavigate('SUBSCRIPTION') },
    ];

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-4 sm:px-6 md:px-8 border-b border-gray-200 dark:border-gray-700 bg-slate-50">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white cursor-pointer" onClick={onHome}>GenieUs</h1>
            {!isInitialPlanSelection && (
                <>
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        
                        {navLinks.slice(0, 4).map(link => (
                             <div key={link.label} className="relative group flex items-center">
                                <button onClick={link.action} className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={link.label}>
                                    {React.cloneElement(link.icon, { className: "w-6 h-6" })}
                                </button>
                                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-40">
                                    {link.label}
                                </div>
                            </div>
                        ))}

                        {/* Support Button */}
                        <div className="relative group">
                            <button onClick={() => onNavigate('CONTACT_SUPPORT')} className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Contact Support">
                                <ChatBubbleLeftIcon className="w-6 h-6" />
                            </button>
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-40">
                                Contact Support
                            </div>
                        </div>
                        
                        <div className="relative group" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="User menu">
                                <UserCircleIcon className="w-6 h-6" />
                            </button>
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-40">
                                My Account
                            </div>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 border border-gray-200 dark:border-[#2B2B2B] z-40">
                                    <div className="px-4 py-3 border-b dark:border-[#2B2B2B]">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.email}</p>
                                        {user.subscription && <p className="text-xs text-gray-500 dark:text-gray-400">{user.subscription.plan} Plan</p>}
                                    </div>
                                    <button onClick={() => onNavigate('SUBSCRIPTION')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                                        <CreditCardIcon className="w-4 h-4" /> Subscription
                                    </button>
                                    <button onClick={onThemeChange} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                                        {theme === 'light' ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
                                        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                                    </button>
                                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                                        <ArrowRightOnRectangleIcon className="w-4 h-4" /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Mobile Navigation */}
                    <div className="md:hidden flex items-center gap-2">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                            <Bars3Icon className="w-6 h-6"/>
                        </button>
                    </div>

                    {isMobileMenuOpen && (
                        <div className="fixed inset-0 bg-slate-50 dark:bg-gray-900 z-50 p-4 flex flex-col">
                            <div className="flex justify-between items-center">
                                <h1 className="text-2xl font-bold">Menu</h1>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                                    <XMarkIcon className="w-6 h-6"/>
                                </button>
                            </div>
                            <nav className="mt-8 flex flex-col gap-2 flex-grow">
                                {navLinks.map(link => (
                                    <button key={link.label} onClick={link.action} className="flex items-center gap-4 p-4 text-lg font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                        {link.icon} {link.label}
                                    </button>
                                ))}
                            </nav>
                            <div className="mt-auto border-t pt-4 space-y-2">
                                <button onClick={() => { setTheme(theme === 'light' ? 'dark' : 'light'); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 text-lg font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                    {theme === 'light' ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
                                    {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                                </button>
                                <button onClick={onLogout} className="w-full flex items-center gap-4 p-4 text-lg font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                    <ArrowRightOnRectangleIcon className="w-5 h-5"/> Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </header>
    );
};

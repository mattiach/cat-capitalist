import type { IconName } from '../../logic/data/iconNames.ts';
import { awardsView } from './awards.ts';
import { boutiqueView } from './boutique.ts';
import { businessesView } from './businesses.ts';
import { catteryView } from './cattery.ts';
import { catShopView } from './catShop.ts';
import { cheatsView } from './cheats.ts';
import { heavenView } from './heaven.ts';
import { investorsView } from './investors.ts';
import { managersView } from './managers.ts';
import { musicView } from './music.ts';
import { profileView } from './profile.ts';
import { superManagersView } from './superManagers.ts';
import { upgradesView } from './upgrades.ts';

/**
 * Sidebar order (Cheats opens from the Profile instead). A view builds its objects (the scene wraps them in a container)
 * and may return a function the scene calls every frame while the tab is open.
 */
export const TABS = [
  { id: 'businesses', label: 'Businesses', icon: 'shop' as IconName, view: businessesView },
  { id: 'managers', label: 'Managers', icon: 'tie' as IconName, view: managersView },
  { id: 'superManagers', label: 'Super Managers', icon: 'royalCrown' as IconName, view: superManagersView },
  { id: 'investors', label: 'Investors', icon: 'briefcase' as IconName, view: investorsView },
  { id: 'upgrades', label: 'Fur Emporium', icon: 'arrowUp' as IconName, view: upgradesView },
  { id: 'boutique', label: 'Boutique', icon: 'pinkBow' as IconName, view: boutiqueView },
  { id: 'music', label: 'Music Store', icon: 'note' as IconName, view: musicView },
  { id: 'catShop', label: 'Cat Shop', icon: 'catFace' as IconName, view: catShopView },
  { id: 'cattery', label: 'Cat Lounge', icon: 'sofa' as IconName, view: catteryView },
  { id: 'awards', label: 'Awards', icon: 'trophy' as IconName, view: awardsView },
  { id: 'heaven', label: 'Cat Heaven', icon: 'halo' as IconName, view: heavenView },
  { id: 'cheats', label: 'Cheats', icon: 'gamepad' as IconName, view: cheatsView },
  { id: 'profile', label: 'Profile', icon: 'floppy' as IconName, view: profileView },
] as const;

export type Tab = (typeof TABS)[number]['id'];

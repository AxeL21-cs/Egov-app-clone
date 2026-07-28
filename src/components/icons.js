import {
  BadgeCheck, Building2, FileText, GraduationCap,
  HeartHandshake, School, UserRound, WalletCards,
} from 'lucide-react';

export const ICONS = {
  'badge-check': BadgeCheck,
  'building-2': Building2,
  'file-text': FileText,
  'graduation-cap': GraduationCap,
  'heart-handshake': HeartHandshake,
  school: School,
  'user-round': UserRound,
  'wallet-cards': WalletCards,
};

export function iconFor(name) {
  return ICONS[name] || FileText;
}

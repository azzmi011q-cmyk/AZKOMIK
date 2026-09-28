import React from 'react';
import {
  Home, Search, Clock3, User, ArrowLeft, XCircle, AlertCircle, ArrowUp,
  ArrowDown, ChevronLeft, ChevronRight, Star, Flame, Sparkles, Trash2,
  Bookmark, BookmarkIcon, BookOpen, Send, MinusCircle, SlidersHorizontal,
  BookOpenText
} from 'lucide-react';

const ionMap = {
  'home-outline': Home, 'search-outline': Search, search: Search,
  'time-outline': Clock3, 'person-outline': User, 'arrow-back': ArrowLeft,
  'close-circle': XCircle, 'alert-circle-outline': AlertCircle,
  'arrow-up': ArrowUp, 'arrow-down': ArrowDown, 'chevron-back': ChevronLeft,
  'chevron-forward': ChevronRight, star: Star, flame: Flame, sparkles: Sparkles,
  'trash-outline': Trash2, bookmark: Bookmark, 'bookmark-outline': BookmarkIcon,
  'book-outline': BookOpen, send: Send, 'remove-circle': MinusCircle,
  'options-outline': SlidersHorizontal
};

function BaseIcon({ Component, size = 24, color = 'currentColor', style, strokeWidth = 2, ...props }) {
  return <Component width={size} height={size} color={color} strokeWidth={strokeWidth} style={style} {...props} />;
}

export function Ionicons({ name, size, color, style, ...props }) {
  const Component = ionMap[name] || AlertCircle;
  return <BaseIcon Component={Component} size={size} color={color} style={style} {...props} />;
}

export function MaterialCommunityIcons({ name, size, color, style, ...props }) {
  const map = { 'book-open-page-variant': BookOpenText };
  return <BaseIcon Component={map[name] || BookOpen} size={size} color={color} style={style} {...props} />;
}

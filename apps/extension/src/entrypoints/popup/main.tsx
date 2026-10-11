import { mount } from '@/lib/mount';
import { bootTheme } from '@/lib/theme';
import { PopupApp } from './PopupApp';

bootTheme();
mount(<PopupApp />);

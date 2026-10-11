import { mount } from '@/lib/mount';
import { bootTheme } from '@/lib/theme';
import { OptionsApp } from './OptionsApp';

bootTheme();
mount(<OptionsApp />);

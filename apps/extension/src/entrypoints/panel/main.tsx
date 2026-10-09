import { mount } from '@/lib/mount';
import { bootTheme } from '@/lib/theme';
import { PanelApp } from './PanelApp';

// Before the first render: apply the cached theme synchronously (no light→dark flash).
bootTheme();
mount(<PanelApp />);

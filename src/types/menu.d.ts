interface MenuItem {
  menu: {
    menuId: number;
    title: string;
    menuUrl: string;
    icon: string;
    componentPath?: string;
  };
  children?: MenuItem[];
} 
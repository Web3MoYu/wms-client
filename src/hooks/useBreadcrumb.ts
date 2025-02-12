import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import userStore from '../store/userStore';

interface BreadcrumbItem {
  key: string;
  title: string;
}

const useBreadcrumb = () => {
  const location = useLocation();
  const user = new userStore();
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    const generateBreadcrumb = (menuTree: any[], path: string) => {
      const breadcrumb: BreadcrumbItem[] = [];

      const findPath = (tree: any[], targetPath: string): boolean => {
        for (const item of tree) {
          if (item.menu.menuUrl === targetPath) {
            breadcrumb.unshift({
              key: item.menu.menuUrl,
              title: item.menu.title,
            });
            return true;
          }
          if (item.children && findPath(item.children, targetPath)) {
            breadcrumb.unshift({
              key: item.menu.menuUrl,
              title: item.menu.title,
            });
            return true;
          }
        }
        return false;
      };

      findPath(menuTree, path);
      return breadcrumb;
    };

    const menuTree = user.menu;
    if (menuTree) {
      const breadcrumb = generateBreadcrumb(menuTree, location.pathname);
      setBreadcrumbItems(breadcrumb);
    }
  }, [location.pathname, JSON.stringify(user.menu)]);

  return breadcrumbItems;
};

export default useBreadcrumb;

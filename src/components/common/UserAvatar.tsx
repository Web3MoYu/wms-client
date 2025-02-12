import { Avatar, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import userStore from '../../store/userStore';
import { observer } from 'mobx-react-lite';

const UserAvatar = observer(() => {
  const user = new userStore();
  
  return (
    <Space>
      <Avatar
        src={user.user?.avatar}
        icon={!user.user?.avatar && <UserOutlined />}
        style={{
          backgroundColor: user.user?.avatar ? 'transparent' : '#1890ff',
          cursor: 'pointer'
        }}
      />
      <span style={{ color: 'rgba(0,0,0,0.65)' }}>
        {user.username}
      </span>
    </Space>
  );
});

export default UserAvatar; 
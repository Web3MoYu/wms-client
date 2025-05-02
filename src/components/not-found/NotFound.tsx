import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleBackHome = () => {
    navigate('/index');
  };

  const handlePreviousPage = () => {
    navigate(-1);
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Result
        status='404'
        title='404'
        subTitle='抱歉，您访问的页面不存在。'
        extra={
          <>
            <Button type='primary' onClick={handlePreviousPage}>
              返回上一页
            </Button>
            <Button type='primary' onClick={handleBackHome}>
              返回首页
            </Button>
          </>
        }
      />
    </div>
  );
};

export default NotFound;

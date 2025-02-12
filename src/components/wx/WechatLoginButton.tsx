import { Button, Modal, Spin } from 'antd';
import { WechatOutlined } from '@ant-design/icons';
import axios from '../../utils/mxAxios';
import { useState } from 'react';

interface WechatLoginProps {
  loading?: boolean;
}

const WechatLoginButton = ({ loading }: WechatLoginProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  const handleWechatLogin = async () => {
    try {
      setQrLoading(true);
      setModalVisible(true);
      // 获取微信登录二维码（这里应该返回微信的授权URL）
      const res = await axios.get('/auth/wx/qrcode');
      setQrCodeUrl(res.data.qrcode);
    } catch (error) {
      console.error('获取二维码失败:', error);
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <>
      <Button
        block
        size='large'
        icon={<WechatOutlined />}
        onClick={handleWechatLogin}
        loading={loading}
        style={{
          backgroundColor: '#07c160',
          color: '#fff',
          borderColor: '#07c160',
          marginTop: 16,
        }}
      >
        微信登录
      </Button>

      <Modal
        title='微信扫码登录'
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        centered
        destroyOnClose
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {qrLoading ? (
            <Spin size='large' />
          ) : (
            qrCodeUrl && (
              <iframe
                src={qrCodeUrl}
                style={{
                  width: '300px',
                  height: '400px',
                  border: 'none',
                  margin: '0 auto',
                }}
                title='wechat-login'
              />
            )
          )}
        </div>
      </Modal>
    </>
  );
};

export default WechatLoginButton;

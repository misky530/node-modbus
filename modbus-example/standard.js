const net = require('net');

// Modbus TCP 请求和响应的帧格式
const MODBUS_FRAME = {
  transactionId: 0,
  protocolId: 0x0000,
  length: 0x0006,
  unitId: 0x01,
  functionCode: 0x03,
  startAddress: 0x0000,
  quantity: 0x000A
};

// Modbus TCP 客户端
const client = new net.Socket();
client.connect(502, '192.168.4.43', () => {
  console.log('Connected to Modbus server');

  // 构建 Modbus 读取保持寄存器的请求帧
  const requestFrame = Buffer.alloc(12);
  requestFrame.writeUInt16BE(MODBUS_FRAME.transactionId, 0);
  requestFrame.writeUInt16BE(MODBUS_FRAME.protocolId, 2);
  requestFrame.writeUInt16BE(MODBUS_FRAME.length, 4);
  requestFrame.writeUInt8(MODBUS_FRAME.unitId, 6);
  requestFrame.writeUInt8(MODBUS_FRAME.functionCode, 7);
  requestFrame.writeUInt16BE(MODBUS_FRAME.startAddress, 0);
  requestFrame.writeUInt16BE(MODBUS_FRAME.quantity, 10);

  // 发送 Modbus 请求帧
  client.write(requestFrame);

  // 接收和解析 Modbus 响应帧
  let responseData = Buffer.alloc(0);
  client.on('data', (data) => {
    responseData = Buffer.concat([responseData, data]);

    // 检查是否已经接收到完整的响应帧
    if (responseData.length >= 9 && responseData.readUInt8(7) === MODBUS_FRAME.functionCode) {
      const byteCount = responseData.readUInt8(8);
      const holdingRegisters = responseData.slice(9, 9 + byteCount);

      // 解析寄存器值为10进制整数
      const registersValues = [];
      for (let i = 0; i < holdingRegisters.length; i += 2) {
        const value = holdingRegisters.readInt16BE(i);
        registersValues.push(value);
      }

      console.log('Read Holding Registers:', registersValues);
      client.destroy();
    }
  });
});

client.on('error', (err) => {
  console.error('Error:', err);
});
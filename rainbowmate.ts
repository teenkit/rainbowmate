
/**
 * 超声波测距返回值的单位
 */
enum PingUnit {
    //% block="微秒"
    MicroSeconds,
    //% block="厘米"
    Centimeters,
    //% block="英寸"
    Inches
}

/**
 * Sonar and ping utilities
 */ 
//% color="#ff6600" weight=10 icon="\uf185" block="teenkit 物联感知"
namespace sonar {
    /**
     * 超声波测距传感器：探测与障碍物之间的直线距离。
     * @param unit desired conversion unit
     * @param maxCmDistance maximum distance in centimeters (default is 500)
     */
    //% blockId="sonar_ping" block="超声波测距，单位 %unit"
    //% weight=90 blockGap=16
    export function ping(unit: PingUnit, maxCmDistance = 500): number {
        // send pulse
        pins.setPull(DigitalPin.P15, PinPullMode.PullNone);
        pins.digitalWritePin(DigitalPin.P15, 0);
        control.waitMicros(2);
        pins.digitalWritePin(DigitalPin.P15, 1);
        control.waitMicros(10);
        pins.digitalWritePin(DigitalPin.P15, 0);

        // read pulse
        const d = pins.pulseIn(DigitalPin.P14, PulseValue.High, maxCmDistance * 58);

        switch (unit) {
            case PingUnit.Centimeters: return Math.idiv(d, 58);
            case PingUnit.Inches: return Math.idiv(d, 148);
            default: return d;
        }
    }

    /**
     * 人体红外传感器,检测人体移动（出现或者位移），发现：true,未发现：false
     */
    //% blockId="human_ir" block="发现人移动"
    //% weight=90 blockGap=16
    export function humanIR(): boolean{
        return pins.digitalReadPin(DigitalPin.P13)==1? true:false
    }

    /**
     * 红外遮挡传感器,有效距离10厘米，对黑色物体无效。被遮挡：true;未遮挡：false；
     */
    //% blockId="block_ir" block="被遮挡"
    //% weight=90 blockGap=16
    export function blockIR():boolean{
        return pins.digitalReadPin(DigitalPin.P16)==1? true:false
    }

    /**
     * 震动马达，数值越大，转速越快
     */
    //% blockId="micro_motor" block="马达震动，转速：%speed"
    //% weight=90 blockGap=16
    //% speed.min=0 speed.max=1023
    export function motor(speed:number):void{
        pins.analogWritePin(AnalogPin.P2, speed)
    }

    /**
     * 噪音传感器
     */
    //% blockId="micro_motor" block="噪音数值"
    //% weight=90 blockGap=16
    export function microphone():number{
        return pins.analogReadPin(AnalogPin.P1)
    }

    /**
     * 开启光照强度传感器
     */
    //% blockId="BH1750_ON" block="开启光照传感器"
    //% weight=90 blockGap=8
    export function on(): void {
        pins.i2cWriteNumber(0x5C, 0x10, NumberFormat.UInt8BE)
    }

    /**
     * 关闭光照强度传感器
     */
    //% blockId="BH1750_OFF" block="关闭光照传感器"
    //% weight=90 blockGap=8
    export function off(): void {
        pins.i2cWriteNumber(0x5C, 0, NumberFormat.UInt8BE)
    }

    /**
     * 读取环境光数值，单位：勒克斯（lx）, 使用前需要先开启光照传感器
     */
    //% blockId="BH1750_GET_INTENSITY" block="光线强度"
    //% weight=80 blockGap=8
    export function getIntensity(): number {
        return Math.idiv(pins.i2cReadNumber(0x5C, NumberFormat.UInt16BE) * 5, 6)
    }

    /*******温湿度传感器************/

    let bmeAddr = 0x77;
    let dig_T1: number;
    let dig_T2: number;
    let dig_T3: number;
    let dig_P1: number;
    let dig_P2: number;
    let dig_P3: number;
    let dig_P4: number;
    let dig_P5: number;
    let dig_P6: number;
    let dig_P7: number;
    let dig_P8: number;
    let dig_P9: number;
    let dig_H1: number;
    let dig_H2: number;
    let dig_H3: number;
    let a: number;
    let dig_H4: number;
    let dig_H5: number;
    let dig_H6: number;
    let T = 0;
    let P = 0;
    let H = 0;

    function initBME280() {
        dig_T1 = getUInt16LE(0x88)
        dig_T2 = getInt16LE(0x8A)
        dig_T3 = getInt16LE(0x8C)
        dig_P1 = getUInt16LE(0x8E)
        dig_P2 = getInt16LE(0x90)
        dig_P3 = getInt16LE(0x92)
        dig_P4 = getInt16LE(0x94)
        dig_P5 = getInt16LE(0x96)
        dig_P6 = getInt16LE(0x98)
        dig_P7 = getInt16LE(0x9A)
        dig_P8 = getInt16LE(0x9C)
        dig_P9 = getInt16LE(0x9E)
        dig_H1 = getreg(0xA1)
        dig_H2 = getInt16LE(0xE1)
        dig_H3 = getreg(0xE3)
        a = getreg(0xE5)
        dig_H4 = (getreg(0xE4) << 4) + (a % 16)
        dig_H5 = (getreg(0xE6) << 4) + (a >> 4)
        dig_H6 = getInt8LE(0xE7)
        setreg(0xF2, 0x04)
        setreg(0xF4, 0x2F)
        setreg(0xF5, 0x0C)
        T = 0
        P = 0
        H = 0
    }

    function setreg(reg: number, dat: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = dat;
        pins.i2cWriteBuffer(bmeAddr, buf);
    }

    function getreg(reg: number): number {
        pins.i2cWriteNumber(bmeAddr, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(bmeAddr, NumberFormat.UInt8BE);
    }

    function getInt8LE(reg: number): number {
        pins.i2cWriteNumber(bmeAddr, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(bmeAddr, NumberFormat.Int8LE);
    }

    function getUInt16LE(reg: number): number {
        pins.i2cWriteNumber(bmeAddr, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(bmeAddr, NumberFormat.UInt16LE);
    }

    function getInt16LE(reg: number): number {
        pins.i2cWriteNumber(bmeAddr, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(bmeAddr, NumberFormat.Int16LE);
    }

    function getBME280(): void {
        let adc_T = (getreg(0xFA) << 12) + (getreg(0xFB) << 4) + (getreg(0xFC) >> 4)
        let var1 = (((adc_T >> 3) - (dig_T1 << 1)) * dig_T2) >> 11
        let var2 = (((((adc_T >> 4) - dig_T1) * ((adc_T >> 4) - dig_T1)) >> 12) * dig_T3) >> 14
        let t = var1 + var2
        T = ((t * 5 + 128) >> 8) / 100
        var1 = (t >> 1) - 64000
        var2 = (((var1 >> 2) * (var1 >> 2)) >> 11) * dig_P6
        var2 = var2 + ((var1 * dig_P5) << 1)
        var2 = (var2 >> 2) + (dig_P4 << 16)
        var1 = (((dig_P3 * ((var1 >> 2) * (var1 >> 2)) >> 13) >> 3) + (((dig_P2) * var1) >> 1)) >> 18
        var1 = ((32768 + var1) * dig_P1) >> 15
        if (var1 == 0)
            return; // avoid exception caused by division by zero
        let adc_P = (getreg(0xF7) << 12) + (getreg(0xF8) << 4) + (getreg(0xF9) >> 4)
        let _p = ((1048576 - adc_P) - (var2 >> 12)) * 3125
        _p = Math.idiv(_p, var1) * 2;
        var1 = (dig_P9 * (((_p >> 3) * (_p >> 3)) >> 13)) >> 12
        var2 = (((_p >> 2)) * dig_P8) >> 13
        P = _p + ((var1 + var2 + dig_P7) >> 4)
        P = P / 100
        let adc_H = (getreg(0xFD) << 8) + getreg(0xFE)
        var1 = t - 76800
        var2 = (((adc_H << 14) - (dig_H4 << 20) - (dig_H5 * var1)) + 16384) >> 15
        var1 = var2 * (((((((var1 * dig_H6) >> 10) * (((var1 * dig_H3) >> 11) + 32768)) >> 10) + 2097152) * dig_H2 + 8192) >> 14)
        var2 = var1 - (((((var1 >> 15) * (var1 >> 15)) >> 7) * dig_H1) >> 4)
        if (var2 < 0) var2 = 0
        if (var2 > 419430400) var2 = 419430400
        H = (var2 >> 12) / 1024

    }

    /**
     * 使用温湿度大气压传感器，读取大气压值，单位：百帕（hPa）。标准大气压为：1013.25hPa，使用前请先开启温湿度大气压传感器
     */
    //% blockId="BME280_PRESSURE" block="大气压"
    //% weight=80 blockGap=8
    export function pressure(): number {
        getBME280();
        return P;
    }

    /**
     * 使用温湿度大气压传感器，读取温度，单位：摄氏度（℃）。使用前请先开启温湿度大气压传感器
     */
    //% blockId="BME280_TEMPERATURE" block="温度"
    //% weight=80 blockGap=8
    export function temperature(): number {
        getBME280();
        return T;
    }

    /**
     * 使用温湿度大气压传感器，读取湿度，单位：百分比（%）。使用前请先开启温湿度大气压传感器
     */
    //% blockId="BME280_HUMIDITY" block="湿度"
    //% weight=80 blockGap=8    
    export function humidity(): number {
        getBME280();
        return H;
    }

    /**
     * 使用温湿度大气压传感器，读取海拔高度，单位：米。使用前请先开启温湿度大气压传感器
     */
    //% blockId="BME280_ELEVATION" block="海拔高度"
    //% weight=80 blockGap=8   
    export function elevation(): number {
        getBME280();
        return (1013.25 - P) * 9;
    }

    /**
     * 启动温湿度、大气压传感器
     */
    //% blockId="BME280_SET_POWER_ON" block="启动温湿度大气压传感器"
    //% weight=61 blockGap=8
    export function setBME280PowerOn() {
        setreg(0xF4, 0x2F)
        initBME280();
        
    }

    /**
     * 停止温湿度、大气压传感器
     */
    //% blockId="BME280_SET_POWER_OFF" block="停止温湿度大气压传感器"
    //% weight=61 blockGap=8
    export function setBME280PowerOff() {
        setreg(0xF4, 0x00)
    }

    
    /**********结束温湿度压力传感器**********/
}

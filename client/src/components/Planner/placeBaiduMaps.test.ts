import { describe, expect, it } from 'vitest';
import { generateBaiduMapsDirectionUrl, getBaiduMapsUrlForPlace } from './placeBaiduMaps';

describe('getBaiduMapsUrlForPlace', () => {
  it('FE-PLACE-BAIDU-001: opens an exact WGS84 marker with encoded place details', () => {
    const url = getBaiduMapsUrlForPlace({
      name: '龙门石窟',
      address: '河南省洛阳市洛龙区',
      lat: 34.5555,
      lng: 112.4702,
    } as any);

    expect(url).toContain('https://api.map.baidu.com/marker?');
    expect(url).toContain('location=34.5555%2C112.4702');
    expect(url).toContain('title=%E9%BE%99%E9%97%A8%E7%9F%B3%E7%AA%9F');
    expect(url).toContain('coord_type=wgs84');
    expect(url).toContain('src=webapp.jiqiao.trek');
  });

  it('FE-PLACE-BAIDU-002: keeps coordinate zero and falls back to a name search', () => {
    expect(getBaiduMapsUrlForPlace({ name: 'Null Island', lat: 0, lng: 0 } as any)).toContain('location=0%2C0');
    expect(getBaiduMapsUrlForPlace({ name: '白马寺', lat: null, lng: null } as any)).toContain(
      'place/search?query=%E7%99%BD%E9%A9%AC%E5%AF%BA'
    );
  });

  it('FE-PLACE-BAIDU-003: returns null without a usable place', () => {
    expect(getBaiduMapsUrlForPlace(null)).toBeNull();
    expect(getBaiduMapsUrlForPlace({ name: '', lat: null, lng: null } as any)).toBeNull();
  });
});

describe('generateBaiduMapsDirectionUrl', () => {
  it('FE-PLACE-BAIDU-004: routes from the first to last valid stop using WGS84', () => {
    const url = generateBaiduMapsDirectionUrl([
      { name: '酒店', lat: 34.62, lng: 112.45 },
      { name: '中途景点', lat: 34.61, lng: 112.46 },
      { name: '龙门石窟', lat: 34.5555, lng: 112.4702 },
    ]);

    expect(url).toContain('https://api.map.baidu.com/direction?');
    expect(url).toContain('origin=latlng%3A34.62%2C112.45%7Cname%3A%E9%85%92%E5%BA%97');
    expect(url).toContain('destination=latlng%3A34.5555%2C112.4702%7Cname%3A%E9%BE%99%E9%97%A8%E7%9F%B3%E7%AA%9F');
    expect(url).toContain('mode=driving');
    expect(url).toContain('coord_type=wgs84');
  });

  it('FE-PLACE-BAIDU-005: returns null when no stop has coordinates', () => {
    expect(generateBaiduMapsDirectionUrl([])).toBeNull();
  });
});

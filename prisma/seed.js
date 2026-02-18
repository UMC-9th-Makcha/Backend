import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const places = [
  // CAFE
  { name: '아파트먼트커피', category: 'CAFE', thumbnailUrl: '/images/waiting-places/cafe/apartment-coffee.jpeg', isOpen24Hours: false, operatingHours: '월: 07:30 - 16:00\n화: 07:30 - 16:00\n수: 08:00 - 16:00\n목: 07:30 - 16:00\n금: 07:30 - 16:00\n토: 08:00 - 16:00\n일: 정기휴무' },
  { name: '카페스토리', category: 'CAFE', thumbnailUrl: '/images/waiting-places/cafe/cafe-story.jpeg', isOpen24Hours: false, operatingHours: '매일: 09:00 - 21:30' },
  { name: '나누리 꽃', category: 'CAFE', thumbnailUrl: '/images/waiting-places/cafe/nanuri-flower.jpeg', isOpen24Hours: false, operatingHours: '월: 10:00 - 20:00\n화: 10:00 - 20:00\n수: 13:00 - 17:00\n목: 10:00 - 20:00\n금: 10:00 - 20:00\n토: 10:00 - 18:00\n일: 정기휴무' },
  { name: '카페톡톡', category: 'CAFE', thumbnailUrl: '/images/waiting-places/cafe/cafe-toktok.jpeg', isOpen24Hours: false, operatingHours: '월: 07:00 - 22:00\n화: 07:00 - 22:00\n수: 07:00 - 22:00\n목: 07:00 - 22:00\n금: 07:00 - 22:00\n토: 07:00 - 22:00\n일: 07:40 - 22:00' },
  { name: '더벤티 대모산입구역점', category: 'CAFE', thumbnailUrl: '/images/waiting-places/cafe/theventi-daemosan.jpeg', isOpen24Hours: false, operatingHours: '월: 08:00 - 20:30\n화: 08:00 - 20:30\n수: 09:00 - 18:30\n목: 08:00 - 20:30\n금: 08:00 - 20:30\n토: 08:00 - 20:30\n일: 08:00 - 20:30' },
  { name: '컴포즈커피 개포중앙점', category: 'CAFE', thumbnailUrl: '/images/waiting-places/cafe/compose-coffee.jpeg', isOpen24Hours: false, operatingHours: '월: 07:00 - 22:00\n화: 07:00 - 22:00\n수: 07:00 - 22:00\n목: 07:00 - 22:00\n금: 07:00 - 22:00\n토: 07:00 - 22:00\n일: 07:40 - 22:00' },
  { name: '커스텀커피 개포점', category: 'CAFE', thumbnailUrl: '/images/waiting-places/cafe/custom-coffee.jpeg', isOpen24Hours: false, operatingHours: '월: 08:00 - 19:00\n화: 08:00 - 19:00\n수: 09:00 - 19:00\n목: 08:00 - 19:00\n금: 08:00 - 19:00\n토: 09:00 - 19:00\n일: 09:00 - 19:00' },
  { name: '칸트의시간 대치점', category: 'CAFE', thumbnailUrl: '/images/waiting-places/cafe/kant-time.jpeg', isOpen24Hours: false, operatingHours: '매일: 09:00 - 23:00' },
  { name: '이디야커피 대청역점', category: 'CAFE', thumbnailUrl: '/images/waiting-places/cafe/ediya-daechung.jpeg', isOpen24Hours: false, operatingHours: '매일: 08:00 - 22:00' },
  { name: '커피인류 개포점', category: 'CAFE', thumbnailUrl: '/images/waiting-places/cafe/coffee-inryu.jpeg', isOpen24Hours: false, operatingHours: '월: 08:00 - 21:00\n화: 08:00 - 21:00\n수: 08:00 - 21:00\n목: 08:00 - 21:00\n금: 08:00 - 21:00\n토: 08:00 - 21:00\n일: 09:00 - 19:00' },

  // PC_ROOM
  { name: '레벨업PC방 대치점', category: 'PC_ROOM', thumbnailUrl: '/images/waiting-places/pc_room/levelup-daechi.jpg', isOpen24Hours: true, operatingHours: '24시간 영업, 연중무휴' },
  { name: '풀타임PC방', category: 'PC_ROOM', thumbnailUrl: '/images/waiting-places/pc_room/fulltime-pc.jpg', isOpen24Hours: true, operatingHours: '24시간 영업, 연중무휴' },
  { name: '제너스PC 대치점', category: 'PC_ROOM', thumbnailUrl: '/images/waiting-places/pc_room/jenus-daechi.jpeg', isOpen24Hours: true, operatingHours: '24시간 영업, 연중무휴' },
  { name: '독스PC방 일원점', category: 'PC_ROOM', thumbnailUrl: '/images/waiting-places/pc_room/dogs-ilwon.jpeg', isOpen24Hours: true, operatingHours: '24시간 영업, 연중무휴' },
  { name: '이스포츠PC방 강남일원점', category: 'PC_ROOM', thumbnailUrl: '/images/waiting-places/pc_room/esports-ilwon.jpeg', isOpen24Hours: true, operatingHours: '24시간 영업, 연중무휴' },
  { name: '덤프(PC방)', category: 'PC_ROOM', thumbnailUrl: '/images/waiting-places/pc_room/dump-pc.jpeg', isOpen24Hours: true, operatingHours: '24시간 영업, 연중무휴' },
  { name: '덤프PC', category: 'PC_ROOM', thumbnailUrl: '/images/waiting-places/pc_room/dump-pc2.jpeg', isOpen24Hours: true, operatingHours: '24시간 영업, 연중무휴' },
  { name: '반트피씨', category: 'PC_ROOM', thumbnailUrl: '/images/waiting-places/pc_room/bant-pc.jpeg', isOpen24Hours: true, operatingHours: '24시간 영업, 연중무휴' },
  { name: '파빌리온 PC카페', category: 'PC_ROOM', thumbnailUrl: '/images/waiting-places/pc_room/pavilion-pc.jpeg', isOpen24Hours: true, operatingHours: '24시간 영업, 연중무휴' },
  { name: '피씨베네 일원점', category: 'PC_ROOM', thumbnailUrl: '/images/waiting-places/pc_room/pc-bene-ilwon.jpeg', isOpen24Hours: true, operatingHours: '24시간 영업, 연중무휴' },

  // SAUNA
  { name: '대청불가마사우나', category: 'SAUNA', thumbnailUrl: '/images/waiting-places/sauna/daecheong-bulgama.jpeg', isOpen24Hours: true, operatingHours: '24시간 영업' },
  { name: '대청불가마사우나 스넥', category: 'SAUNA', thumbnailUrl: '/images/waiting-places/sauna/daecheong-bulgama-snack.jpeg', isOpen24Hours: true, operatingHours: '24시간 영업' },
  { name: '테르엔 강남일원점', category: 'SAUNA', thumbnailUrl: '/images/waiting-places/sauna/teruen-ilwon.jpeg', isOpen24Hours: false, operatingHours: '매일: 06:00 - 21:00' },
  { name: '오성불한증막', category: 'SAUNA', thumbnailUrl: '/images/waiting-places/sauna/oseong-hanjeung.jpeg', isOpen24Hours: true, operatingHours: '24시간 영업' },
  { name: '골드로즈사우나', category: 'SAUNA', thumbnailUrl: '/images/waiting-places/sauna/goldrose-sauna.jpeg', isOpen24Hours: true, operatingHours: '24시간 영업' },
  { name: '세신샵 스파 헤움', category: 'SAUNA', thumbnailUrl: '/images/waiting-places/sauna/seshin-heum.jpeg', isOpen24Hours: false, operatingHours: '매일: 08:00 - 24:00' },
  { name: '백제불한증막인삼사우나', category: 'SAUNA', thumbnailUrl: '/images/waiting-places/sauna/baekje-sauna.jpeg', isOpen24Hours: true, operatingHours: '24시간 영업, 연중무휴' },
  { name: '클럽케이서울 찜질방사우나', category: 'SAUNA', thumbnailUrl: '/images/waiting-places/sauna/clubk-seoul.jpeg', isOpen24Hours: true, operatingHours: '24시간 영업, 연중무휴' },
];

async function main() {
  console.log('🌱 Seeding WaitingPlaceMeta...');
  for (const place of places) {
    await prisma.waitingPlaceMeta.upsert({
        where: { name: place.name },
        update: {
          imageUrl: place.thumbnailUrl,       // thumbnailUrl → imageUrl
          is24Hours: place.isOpen24Hours,     // isOpen24Hours → is24Hours
          operatingHours: place.operatingHours,
          category: place.category,
        },
        create: {
          name: place.name,
          category: place.category,
          imageUrl: place.thumbnailUrl,       // thumbnailUrl → imageUrl
          is24Hours: place.isOpen24Hours,     // isOpen24Hours → is24Hours
          operatingHours: place.operatingHours,
        },
      });
  }
  console.log(`${places.length}개 장소 seed 완료`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
async function enterBuilding(door) {
  hero.lock();
  await door.open();
  await hero.move(DIR.UP);
  await door.close();
  await screen.fade(FADE.OUT);
  await enterMapByWarp(door);
  await screen.fade(FADE.IN);
  hero.unlock();
};

async function leaveBuilding(door) {
  hero.lock();
  await screen.fade(FADE.OUT);
  await enterMapByWarp(door);
  door.open(DOOR.FORCE_OPEN);
  await screen.fade(FADE.IN);
  await hero.move(DIR.DOWN);
  await door.close();
  hero.unlock();
};

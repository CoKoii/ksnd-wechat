const BASIC_HOME_PATH = "/pages/home/home";

const formatTime = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return `${[year, month, day].map(formatNumber).join("/")} ${[
    hour,
    minute,
    second,
  ]
    .map(formatNumber)
    .join(":")}`;
};

const formatNumber = (n) => {
  const text = String(n);
  return text[1] ? text : `0${text}`;
};

module.exports = {
  BASIC_HOME_PATH,
  formatTime,
};

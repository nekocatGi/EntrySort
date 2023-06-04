window.addEventListener("beforeunload", function(event) {
  event.returnValue = null;
});

let filenames = [],
  dirHandle = "",
  speed = false,
  backup;
const listbox = document.getElementById("-LISTBOX-");

function display() {
  let n = 0;
  for (let fn of filenames) {
    n++;
    listbox.options[n - 1].textContent = String(n).padStart(3, "0") + " " + fn;
  }
}

async function getFolder() {
  dirHandle = await window.showDirectoryPicker();
  document.getElementById("name").textContent = dirHandle.name;
  listbox.innerHTML = "";
  filenames = [];
  speed = false;
  let number = 0;
  for await (let [name, handle] of dirHandle) {
    if (handle.kind === "directory") {
      if (name === "temp_folder") {
        let childDirHandle = await dirHandle.getDirectoryHandle(name);
        for await (let [name, handle] of  childDirHandle) {
          if (handle.kind === "directory") {
            dirHandle = "";
            document.getElementById("name").textContent = "";
            alert("フォルダのソートはできません!");
            listbox.innerHTML = "";
            return;
          }
          number++;
          const row = document.createElement("option");
          row.textContent = String(number).padStart(3, "0") + " " + name;
          row.value = number - 1;
          if (number % 2 === 0) row.style.background = "#EDEDED";
          filenames.push(name);
          listbox.appendChild(row);
        }
        backup = filenames.concat();
        speed = true;
      } else {
        dirHandle = "";
        document.getElementById("name").textContent = "";
        alert("フォルダのソートはできません!");
        listbox.innerHTML = "";
      }
      return;
    }
    number++;
    const row = document.createElement("option");
    row.textContent = String(number).padStart(3, "0") + " " + name;
    row.value = number - 1;
    if (number % 2 === 0) row.style.background = "#EDEDED";
    filenames.push(name);
    listbox.appendChild(row);
  }
  backup = filenames.concat();
}

function select() {
  const first_i = Number(listbox.value);
  const last_i = first_i + Number(document.getElementById("n").value);
  for (let i = first_i; i < last_i; i++) {
    listbox.options[i].selected = true;
  }
}

function select2() {
  listbox.value = listbox.value;
  const first_i = Number(listbox.value);
  const last_i = first_i + Number(document.getElementById("n").value);
  for (let i = first_i; i < last_i; i++) {
    listbox.options[i].selected = true;
  }
}

function move(type) {
  let join_i = Number(listbox.value),
    n = Number(document.getElementById("n").value),
    move_i,
    t;
  if (n < 0) n = 0;
  if (type === "up") {
    move_i = join_i - 1;
    if (move_i < 0) return;
    t = filenames[move_i];
    filenames.splice(move_i, 1);
    filenames.splice(move_i + n, 0, t);
  } else {
    move_i = join_i + 1;
    if (join_i + n >= filenames.length) return;
    t = filenames[join_i + n];
    filenames.splice(join_i + n, 1);
    filenames.splice(join_i, 0, t);
  }
  display();
  if (n === 1) {
    listbox.value = move_i;
  } else {
    listbox.value = move_i;
    for (let i = move_i; i < move_i + n; i++) {
      listbox.options[i].selected = true;
    }
  }
  listbox.options[move_i - 7].scrollIntoView();
}

function insert() {
  let n = Number(document.getElementById("n").value),
    join_i = Number(listbox.value),
    move_i = Number(document.getElementById("index").value);
  if (move_i < 0) move_i = 0;
  if (move_i > filenames.length) move_i = filenames.length;
  if (move_i - 1 >= join_i - 1 && move_i - 1 <= join_i + n) return;
  const t = filenames.slice(join_i, join_i + n);
  filenames.splice(join_i, n);
  if (move_i - 1 > join_i) {
    move_i -= n;
  }
  filenames.splice(move_i, 0, ...t);
  display();
  if (n === 1) {
    listbox.value = move_i;
  } else {
    listbox.value = move_i;
    for (let i = move_i; i < move_i + n; i++) {
      listbox.options[i].selected = true;
    }
  }
  listbox.options[move_i - 7].scrollIntoView();
}

async function exe() {
  const bar = document.getElementById("-BAR-"),
        btn = document.getElementById("btn");
  bar.max = filenames.length;
  btn.textContent = "反映中...";
  btn.style.color = "black";
  btn.style.backgroundColor = "whitesmoke";
  btn.disabled = true;
  try {
    if (speed) {
      let childDirHandle = await dirHandle.getDirectoryHandle("temp_folder");
      for (let fn of filenames) {
        let fileHandle = await childDirHandle.getFileHandle(fn);
        await fileHandle.move(dirHandle);
        bar.value++;
      }
      await dirHandle.removeEntry("temp_folder");
    } else {
      const random = Math.random().toString(32).substring(2),
            temp = "temp_folder_" + random;
      let handles = [];
      for (let fn of filenames) {
        let fileHandle = await dirHandle.getFileHandle(fn);
        handles.push(fileHandle);
      }
      let childDirHandle = await dirHandle.getDirectoryHandle(temp, {
        create: true,
      });
      for (let fh of handles) {
        await fh.move(childDirHandle);
        bar.value += 0.5;
      }
      for (let fh of handles) {
        await fh.move(dirHandle);
        bar.value += 0.5;
      }
      await dirHandle.removeEntry(temp);
    }
    alert("反映が完了しました。");
  } catch (err) {
    alert("エラーが発生しました。\nエラーメッセージ:"+err);
  }
  bar.value = 0;
  btn.textContent = "反映";
  btn.style.color = "white";
  btn.style.backgroundColor = "#1598d1";
  btn.disabled = false;
}

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

function sort(type) {
  switch (type) {
    case 1:
      filenames.sort();
      break;
    case 2:
      filenames.sort().reverse();
      break;
    case 3:
      filenames.reverse();
      break;
    case 4:
      shuffle(filenames);
      break;
    case 5:
      filenames = backup.concat();
  }
  display();
}

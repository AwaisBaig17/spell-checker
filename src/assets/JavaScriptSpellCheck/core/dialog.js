var livespell;
var E$ = function (id) {
  return document.getElementById(id);
};
var spellWin = {
  dialog_win: window,
  resumeAfterEditing: function () {
    this.pickup();
    spellWin.regroup(false);
  },
  isStillOpen: function () {
    return window.document != null;
  },
  providerID: null,
  provider: function () {
    if (!livespell) {
      this.handshake();
    }
    return livespell.spellingProviders[this.providerID];
  },
  lang: {
    localize_ui: function () {
      document.title = this.fetch("WIN_TITLE");
      E$("btnAddToDict").value = this.fetch("BTN_ADD_TO_DICT");
      E$("btnAutoCorrect").value = this.fetch("BTN_AUTO_CORECT");
      E$("btnOptionsCancel").value = E$("btnLangCancel").value =
        this.fetch("BTN_CANCEL");
      E$("btnChange").value = this.fetch("BTN_CHANGE");
      E$("btnChangeAll").value = this.fetch("BTN_CHANGE_ALL");
      E$("btnCancel").value = this.fetch("BTN_CLOSE");
      E$("btnIgnoreAll").value = this.fetch("BTN_IGNORE_ALL");
      E$("btnIgnore").value = this.fetch("BTN_IGNORE_ONCE");
      E$("btnUndoManualEdit").value = this.fetch("BTN_CLEAR_EDIT");
      E$("btnUndo").value = this.fetch("BTN_UNDO");
      E$("btnAllDone").value =
        E$("btnOptionsOK").value =
        E$("btnLangOK").value =
          this.fetch("BTN_OK");
      E$("btnShowOptions").value = this.fetch("BTN_OPTIONS");
      E$("btnResetDict").value = E$("btnResetAutoCorrect").value =
        this.fetch("BTN_RESET");
      E$("tSum").innerHTML = this.fetch("DONESCREEN_MESSAGE");
      E$("fldLanguageLab").innerHTML = this.fetch("LABEL_LANGAUGE");
      E$("SuggestionsLab").innerHTML = this.fetch("LABEL_SUGGESTIONS");
      E$("fldLanguageMultipleLabText").innerHTML = this.fetch(
        "LANGUAGE_MULTIPLE_INSTRUCTIONS"
      );
      E$("lMeaningLink").innerHTML = this.fetch("LOOKUP_MEANING");
      E$("optCaseSensitiveText").innerHTML = this.fetch("OPT_CASE_SENSITIVE");
      E$("optAllCapsbText").innerHTML = this.fetch("OPT_IGNORE_CAPS");
      E$("optNumericText").innerHTML = this.fetch("OPT_IGNORE_NUMERIC");
      E$("optSentenceText").innerHTML = this.fetch("OPT_SENTENCE_AWARE");
      E$("btnResetDictLabText").innerHTML = this.fetch("OPT_PERSONAL_DICT");
      E$("btnResetAutoCorrectLabText").innerHTML = this.fetch(
        "OPT_PERSONAL_AUTO_CURRECT"
      );
      if (spellWin.provider().AddWordsToDictionary == "SERVER") {
        E$("btnAddToDict").value = this.fetch("BTN_ADD_TO_DICT").replace(
          "Personal",
          "Word"
        );
      }
    },
    fetch: function (index) {
      return livespell.lang.fetch(spellWin.providerID, index);
    },
  },
  allDone: false,
  docs: [],
  wordstocheck: [],
  currentDoc: 0,
  currentToken: 0,
  currentReason: "",
  editcount: 0,
  suggestionsInMotion: true,
  undo: {
    bookmarks: [],
    set: function (action) {
      var mem = {};
      var targets = "currentDoc,currentReason,currentToken,editcount".split(
        ","
      );
      for (var i = 0; i < targets.length; i++) {
        mem[targets[i]] = spellWin[targets[i]];
      }
      mem.word = spellWin.tokens.getCurrent();
      mem.docs = this.arrayCopy(spellWin.docs);
      mem.action = action + "";
      if (action === "ADD") {
        mem.add = livespell.cookie.get("SPELL_DICT_USER");
      }
      if (action === "AUTO") {
        mem.auto = livespell.cookie.get("SPELL_AUTOCORRECT_USER");
      }
      this.bookmarks.push(mem);
      if (this.bookmarks.length > spellWin.provider().UndoLimit) {
        this.bookmarks.shift();
      }
    },
    get: function () {
      var mem = this.bookmarks.pop();
      if (!mem) {
        return;
      }
      var targets = "currentDoc,currentReason,currentToken,editcount".split(
        ","
      );
      for (var i = 0; i < targets.length; i++) {
        spellWin[targets[i]] = mem[targets[i]];
      }
      delete spellWin.docs;
      spellWin.docs = this.arrayCopy(mem.docs);
      delete livespell.cache.ignore[mem.word];
      if (mem.action === "ADD") {
        spellWin.actions.deletePersonal();
        livespell.cookie.set("SPELL_DICT_USER", mem.add);
      }
      if (mem.action === "AUTO") {
        spellWin.actions.deleteAutoCorrect();
        livespell.cookie.set("SPELL_AUTOCORRECT_USER", mem.auto);
      }
      spellWin.tokenize();
      spellWin.moveNext();
    },
    arrayCopy: function (ain) {
      var aout = [];
      for (var it in ain) {
        aout[it] = ain[it];
      }
      return aout;
    },
  },
  tokens: {
    value: [],
    countWords: function () {
      var num = 0;
      for (var i = 0; i < this.value.length; i++) {
        for (var j = 0; j < this.value[i].length; j++) {
          if (this.isWord(i, j)) {
            num++;
          }
        }
      }
      return num;
    },
    next: function () {
      spellWin.currentToken++;
      if (spellWin.currentToken > this.value[spellWin.currentDoc].length) {
        spellWin.currentDoc++;
        spellWin.currentToken = 0;
      }
    },
    set: function (i, j, val) {
      this.value[i][j] = val;
    },
    setCurrent: function (val) {
      this.value[spellWin.currentDoc][spellWin.currentToken] = val;
    },
    getCurrent: function () {
      return this.value[spellWin.currentDoc][spellWin.currentToken];
    },
    isWord: function (i, j) {
      return livespell.test.isword(this.value[i][j]);
    },
    startsSentence: function (i, j) {
      return j < 2 || livespell.test.eos(this.value[i][j - 1]);
    },
    findAndReplace: function ($$from, $$to, $$toCase) {
      for (var i = 0; i < this.value.length; i++) {
        for (var j = 0; j < this.value[i].length; j++) {
          if (
            this.isWord(i, j) &&
            this.value[i][j].toLowerCase() == $$from.toLowerCase()
          ) {
            this.value[i][j] = livespell.str.toCase(
              $$to,
              livespell.str.getCase(this.value[i][j]),
              this.startsSentence(i, j)
            );
            spellWin.editcount++;
          }
        }
      }
    },
    appetureXHTML: function (i, j, green) {
      var $$appeture = this.appeture(i, j, true);
      var $$out = "";
      for (var k = $$appeture.min; k <= $$appeture.max; k++) {
        var $$fragment = this.value[i][k];
        $$fragment =
          $$fragment == undefined ? "" : livespell.str.HTMLEnc("" + $$fragment);
        if (k == j) {
          if (!green) {
            $$fragment = '<span id="highlight">' + $$fragment + "</span>";
          } else {
            $$fragment =
              '<span id="highlightGrammar">' + $$fragment + "</span>";
          }
        }
        $$out += $$fragment;
      }
      return $$out;
    },
    setAppeture: function (i, j, value) {
      var $$appeture = this.appeture(i, j, true);
      for (var k = $$appeture.min; k <= $$appeture.max; k++) {
        if (k == $$appeture.min) {
          this.value[i][k] = value;
        } else {
          this.value[i][k] = "";
        }
      }
      spellWin.currentToken = $$appeture.min;
    },
    appetureText: function (i, j) {
      var $$appeture = this.appeture(i, j, true);
      var start = -1;
      var end = -1;
      $$out = "";
      for (var k = $$appeture.min; k <= $$appeture.max; k++) {
        var $$fragment = this.value[i][k];
        if ($$fragment) {
          $$out += $$fragment;
        }
        if (k == j) {
          end = $$out.length;
          start = end - $$fragment.length;
        }
      }
      if (
        $$out.length > 2 &&
        livespell.test.IE() &&
        $$out.charCodeAt($$out.length - 1) == 13
      ) {
        $$out = $$out.substr(0, $$out.length - 1);
      }
      var textap = {};
      textap.text = $$out;
      textap.start = start;
      textap.end = end;
      return textap;
    },
    appeture: function (i, j, binsafe) {
      var doclen = this.value[i].length;
      var found = false;
      for (var $$min = j; $$min > 0 && $$min > j - 15 && !found; $$min--) {
        if (
          livespell.test.eos(this.value[i][$$min]) ||
          livespell.test.HTML(this.value[i][$$min]) ||
          livespell.test.nl(this.value[i][$$min])
        ) {
          found = true;
          break;
        }
      }
      found = false;
      if ($$min > 0 || livespell.test.HTML(this.value[i][$$min])) {
        $$min++;
      }
      for (var $$max = j; $$max < doclen && $$max < j + 25 && !found; $$max++) {
        if (
          livespell.test.eos(this.value[i][$$max]) ||
          livespell.test.HTML(this.value[i][$$max]) ||
          livespell.test.nl(this.value[i][$$max])
        ) {
          $$max--;
          found = true;
          break;
        }
      }
      var $$appeture = {};
      $$appeture.min = $$min;
      $$appeture.max = $$max;
      return $$appeture;
    },
  },
  actions: {
    registerclose: function () {
      spellWin.provider().docFocus(-1);
      if (spellWin.allDone) {
        spellWin.provider().onDialogCompleteNET();
        spellWin.provider().onDialogComplete();
        spellWin.provider().__SubmitForm();
      } else {
        spellWin.provider().onDialogClose();
      }
    },
    done: function () {
      spellWin.provider().onDialogCompleteNET();
      spellWin.provider().onDialogComplete();
      spellWin.provider().__SubmitForm();
      spellWin.allDone = false;
      if (
        !spellWin.provider().ShowSummaryScreen &&
        spellWin.provider().isUniPacked &&
        spellWin.undo.bookmarks.length == 0
      ) {
        var doret = false;
        srthtml =
          "<h2 class='spellnofify'>" +
          spellWin.lang.fetch("DONESCREEN_MESSAGE") +
          "</h2><br/>";
        try {
          window.parent.Modalbox.show(srthtml, {
            title: spellWin.lang.fetch("WIN_TITLE"),
            slideDownDuration: 0.2,
            slideUpDuration: 0.2,
          });
          doret = true;
        } catch (e) {}
        try {
          window.opener.Modalbox.show(srthtml, {
            title: spellWin.lang.fetch("WIN_TITLE"),
            slideDownDuration: 0.2,
            slideUpDuration: 0.2,
          });
          doret = true;
        } catch (e) {}
        try {
          window.opener.Modalbox.resizeToContent();
        } catch (e) {}
        if (doret) {
          return;
        }
      }
      if (spellWin.provider().CustomOpenerClose) {
        spellWin.provider().CustomOpenerClose();
      } else if (window.opener || window.parent) {
        window.iclose();
      } else if (dialogArguments && dialogArguments.document) {
        window.iclose();
      }
    },
    cancel: function () {
      spellWin.provider().onDialogCancel();
      if (spellWin.provider().CustomOpenerClose) {
        spellWin.provider().CustomOpenerClose();
      } else if (window.opener || window.parent) {
        window.iclose();
      } else if (dialogArguments && dialogArguments.document) {
        window.iclose();
      }
    },
    changeLanguage: function () {
      if (
        spellWin.ui.getMenuValue("fldLanguage") ==
        spellWin.lang.fetch("LANGUAGE_MULTIPLE")
      ) {
        spellWin.optionsMenu.showMultiLang(true);
      } else {
        spellWin.provider().Language = spellWin.ui.getMenuValue("fldLanguage");
        spellWin
          .provider()
          .onChangeLanguage(spellWin.ui.getMenuValue("fldLanguage"));
        spellWin.currentDoc = 0;
        spellWin.currentToken = 0;
        spellWin.regroup(false);
      }
    },
    changeMultiLanguage: function () {
      spellWin.provider().Language = spellWin.ui.getMenuValue(
        "fldLanguageMultiple"
      );
      spellWin
        .provider()
        .onChangeLanguage(spellWin.ui.getMenuValue("fldLanguageMultiple"));
      spellWin.optionsMenu.showMultiLang(false);
      spellWin.ui.setupLanguageMenu();
      spellWin.currentDoc = 0;
      spellWin.currentToken = 0;
      spellWin.regroup(false);
    },
    deletePersonal: function () {
      livespell.userDict.forget();
      livespell.cookie.erase("SPELL_DICT_USER");
      RemoveFromServer();
      spellWin.provider().docRePaint();
    },
    deleteAutoCorrect: function () {
      livespell.cookie.erase("SPELL_AUTOCORRECT_USER");
    },
    ignoreOnce: function () {
      spellWin.undo.set();
      spellWin.provider().onIgnore(spellWin.tokens.getCurrent());
      spellWin.tokens.next();
      return spellWin.moveNext();
    },
    ignoreAll: function () {
      spellWin.undo.set();
      livespell.cache.ignore[spellWin.tokens.getCurrent().toLowerCase()] = true;
      spellWin.provider().onIgnoreAll(spellWin.tokens.getCurrent());
      spellWin.tokens.next();
      return spellWin.moveNext();
    },
    changeCurrent: function () {
      spellWin.undo.set();
      spellWin.editcount++;
      if (spellWin.ui.editingNow) {
        spellWin.tokens.setAppeture(
          spellWin.currentDoc,
          spellWin.currentToken,
          E$("fldTextInput").value
        );
        spellWin
          .provider()
          .onChangeWord(spellWin.tokens.getCurrent(), E$("fldTextInput").value);
        spellWin.ui.showEdit(false);
        spellWin.moveNext();
        return;
      }
      var oS = E$("fldSuggestions");
      var os_value = spellWin.ui.getMenuValue("fldSuggestions");
      if (oS.disabled) {
        if (os_value == "__*DEL*__") {
          spellWin.provider().onChangeWord(spellWin.tokens.getCurrent(), "");
          spellWin.tokens.setCurrent("");
          spellWin.tokens.set(
            spellWin.currentDoc,
            spellWin.currentToken - 1,
            livespell.str.rtrim(
              spellWin.tokens.value[spellWin.currentDoc][
                spellWin.currentToken - 1
              ]
            )
          );
          spellWin.currentToken--;
        }
        if (os_value == "NONE") {
          spellWin.tokens.next();
          return spellWin.moveNext();
        }
      } else {
        if (os_value == "__*REG*__") {
          var a;
          if (spellWin.provider().isUniPacked) {
            a = "javascriptspellcheck";
          } else if (
            spellWin.provider().ServerModel.toLowerCase() == "asp.net" ||
            spellWin.provider().ServerModel.toLowerCase() == "aspx"
          ) {
            a = "aspnetspell";
          } else if (spellWin.provider().ServerModel.toLowerCase() == "asp") {
            a = "aspspellcheck";
          } else {
            a = "phpspellcheck";
          }
          window.open(
            "h" +
              "tt" +
              "p" +
              ":" +
              "/" +
              "/w" +
              "ww." +
              a +
              ".c" +
              "om/Pur" +
              "" +
              "cha" +
              "se"
          );
        } else {
          spellWin
            .provider()
            .onChangeWord(spellWin.tokens.getCurrent(), os_value);
          spellWin.tokens.setCurrent(os_value);
        }
      }
      spellWin.tokens.next();
      return spellWin.moveNext();
    },
    changeAll: function () {
      spellWin.undo.set();
      var $$from = spellWin.tokens.getCurrent();
      var $$to = spellWin.ui.getMenuValue("fldSuggestions");
      var $$toCase = livespell.str.getCase($$to);
      spellWin.tokens.findAndReplace($$from, $$to, $$toCase);
      spellWin.provider().onChangeAll($$from, $$to);
      spellWin.tokens.next();
      spellWin.moveNext();
    },
    addPersonal: function (word) {
      spellWin.undo.set("ADD");
      word = spellWin.tokens.getCurrent();
      if (spellWin.provider().AddWordsToDictionary == "SERVER") {
        livespell.ajax.send("SAVEWORD", word, 0, 0, spellWin.provider().id());
      }
      livespell.userDict.add(word);
      spellWin.provider().docRePaint();
      spellWin.provider().onLearnWord(spellWin.tokens.getCurrent());
      spellWin.moveNext();
    },
    addAutoCorrect: function () {
      spellWin.undo.set("AUTO");
      $$current_cookie = livespell.cookie.get("SPELL_AUTOCORRECT_USER");
      var $$from = spellWin.tokens.getCurrent();
      var $$to = spellWin.ui.getMenuValue("fldSuggestions");
      var $$toCase = livespell.str.getCase($$to);
      spellWin.tokens.findAndReplace($$from, $$to, $$toCase);
      if ($$current_cookie) {
        $$current_cookie = livespell.str.chr(1) + $$current_cookie;
      }
      $$current_cookie =
        $$from + "->" + $$to + "#" + $$toCase + $$current_cookie;
      livespell.cookie.setLocal("SPELL_AUTOCORRECT_USER", $$current_cookie);
      spellWin.provider().docRePaint();
      spellWin.provider().onLearnAutoCorrect($$from, $$to);
      spellWin.moveNext();
    },
  },
  optionsMenu: {
    showMultiLang: function (flag) {
      spellWin.ui.show("multiLangForm", flag);
      spellWin.ui.show("MainForm", !flag);
      var fLang = E$("fldLanguage");
      if (!flag) {
        for (var i = 0; i < fLang.options.length; i++) {
          if (fLang.options[i].value == spellWin.provider().Language) {
            fLang.selectedIndex = i;
          }
        }
      }
    },
    show: function (flag) {
      if (flag) {
        var pdict = livespell.cookie.get("SPELL_DICT_USER");
        GetAddToDictionaryWordsCount();

        var pauto = livespell.cookie.get("SPELL_AUTOCORRECT_USER");
        var intPersonalAutoEntries = pauto.length
          ? pauto.split(livespell.str.chr(1)).length
          : 0;
        E$("tAutoCorrectCount").innerHTML =
          intPersonalAutoEntries + " " + spellWin.lang.fetch("OPT_ENTRIES");
        spellWin.ui.enable("btnResetAutoCorrect", intPersonalAutoEntries > 0);
        GetUserSettings();
      }
      spellWin.ui.show("optForm", flag);
      spellWin.ui.show("MainForm", !flag);
    },
    loadCount: function (count) {
      var intPersonalEntries = count;
      E$("tDictCount").innerHTML =
        intPersonalEntries + " " + spellWin.lang.fetch("OPT_ENTRIES");
      spellWin.ui.enable("btnResetDict", intPersonalEntries > 0);
    },
    set: function () {
      spellWin
        .provider()
        .setFormVals(
          E$("optCaseSensitive").checked,
          E$("optAllCaps").checked,
          E$("optNumeric").checked,
          E$("optSentence").checked
        );
      this.show(false);
      spellWin.moveNext();
    },
  },
  init: function () {
    this.handshake();
    this.pickup();
    this.setTheme();
    this.hideButtons();
    spellWin.provider().setFieldListeners();
    setInterval(this.openerAware, 100);
    this.lang.localize_ui();
    E$("optSentence").checked = spellWin.provider().CheckGrammar;
    this.ui.setLoadingMessage();
    spellWin.tokenize();
    this.autoCorrectOnLoad();
    livespell.userDict.load();
    this.ui.disableAll();
    this.suggestionsInMotion = false;
    spellWin.buildWordQue();
    this.sendInitialAJAXRequest(false);
  },
  openerAware: function () {
    if (window.opener || window.parent) {
      return;
    }
    try {
      if (dialogArguments && dialogArguments.document) {
        return;
      }
    } catch (e) {}
    window.iclose();
  },
  regroup: function (binisrepeat) {
    this.suggestionsInMotion = false;
    this.ui.setLoadingMessage();
    spellWin.tokenize();
    this.ui.disableAll();
    spellWin.buildWordQue();
    if (livespell.cache.wordlist[spellWin.providerID].length > 0) {
      this.sendInitialAJAXRequest(binisrepeat);
    } else {
      if (!binisrepeat) {
        spellWin.moveNext();
      }
    }
  },
  nextSuggestionChunk: function () {
    if (!this.suggestionsInMotion) {
      return this.regroup(true);
    }
    var chunksize = 8;
    livespell.cache.suglist = [];
    for (var i = spellWin.currentDoc; i < this.tokens.value.length; i++) {
      for (
        var j = i == spellWin.currentDoc ? spellWin.currentToken : 0;
        j < this.tokens.value[i].length;
        j++
      ) {
        var spelltest = livespell.test.spelling(
          this.tokens.value[i][j],
          spellWin.provider().Language
        );
        var unknown =
          !livespell.cache.suggestions[spellWin.provider().Language][
            this.tokens.value[i][j]
          ];
        if (this.tokens.isWord(i, j) && !spelltest && unknown) {
          livespell.cache.suglist = livespell.array.safepush(
            livespell.cache.suglist,
            this.tokens.value[i][j]
          );
          if (livespell.cache.suglist.length >= chunksize) {
            return this.fetchSuggestionRequest();
          }
        }
      }
    }
    if (livespell.cache.suglist.length) {
      return this.fetchSuggestionRequest();
    }
    this.suggestionsInMotion = false;
  },
  fetchSuggestionRequest: function () {
    livespell.ajax.send(
      "WINSUGGEST",
      livespell.cache.suglist.join(livespell.str.chr(1)),
      spellWin.provider().Language,
      "",
      spellWin.providerID
    );
  },
  notify: function () {
    delete this.docs;
    this.docs = [];
    for (var i = 0; i < this.tokens.value.length; i++) {
      this.docs[i] = this.tokens.value[i].join("");
    }
    spellWin.tokenize();
    spellWin.provider().docUpdate(this.docs);
  },
  autoCorrectOnLoad: function () {
    var $$current_cookie = livespell.cookie.get("SPELL_AUTOCORRECT_USER");
    if (!$$current_cookie) {
      return false;
    }
    var $$mycmds = $$current_cookie.split(livespell.str.chr(1));
    for (var key in $$mycmds) {
      var mycmd = $$mycmds[key];
      if (!mycmd || !mycmd.length) {
        return;
      }
      try {
        var a_mycmd = mycmd.split("->");
        if (a_mycmd[1]) {
          var from = a_mycmd[0];
          var to = a_mycmd[1].split("#")[0];
          var toCase = a_mycmd[1].split("#")[1];
          livespell.cache.ignore[to.toLowerCase()] = true;
          this.tokens.findAndReplace(from, to, toCase);
        }
      } catch (e) {}
    }
  },
  moveNext: function () {
    this.notify();
    try {
      window.focus();
    } catch (e) {}
    var $$typo = this.FindNextTypo();
    if ($$typo === null) {
      return;
    }
    var suggestions =
      livespell.cache.suggestions[spellWin.provider().Language][$$typo];
    var reason = spellWin.currentReason;
    var newSentence = this.tokens.startsSentence(
      spellWin.currentDoc,
      spellWin.currentToken
    );
    var suggestionsPending =
      reason !== "R" &&
      reason !== "G" &&
      !livespell.cache.suggestions[spellWin.provider().Language][$$typo];
    if (suggestionsPending) {
      this.ui.disableAll();
      if (!this.suggestionsInMotion) {
        this.suggestionsInMotion = true;
        spellWin.nextSuggestionChunk();
      }
      return setTimeout("spellWin.moveNext()", 1000);
    }
    var isGreen = reason == "G" || reason == "R";
    if (!isGreen) {
      var oCase = livespell.str.getCase($$typo);
      if (oCase === 2) {
        for (var j = 0; j < suggestions.length; j++) {
          suggestions[j] = suggestions[j].toUpperCase();
        }
      }
      if (oCase === 1) {
        for (var j = 0; j < suggestions.length; j++) {
          suggestions[j] = livespell.str.toCaps(suggestions[j]);
        }
      }
    }
    if (!suggestions || !suggestions.length || suggestions[0] === "") {
      suggestions = [];
    }
    var dsuggs = [];
    for (j = 0; j < suggestions.length; j++) {
      dsuggs = livespell.array.safepush(dsuggs, suggestions[j]);
    }
    suggestions = dsuggs;
    E$("TextShow").innerHTML = this.tokens.appetureXHTML(
      spellWin.currentDoc,
      spellWin.currentToken,
      isGreen
    );
    var target = E$("highlightGrammar") || E$("highlight");
    if (target && target.offsetTop) {
      target.parentNode.scrollTop =
        target.offsetTop - target.parentNode.offsetTop;
    }
    var oS = E$("fldSuggestions");
    oS.options.length = 0;
    if (reason == "G") {
      if (!suggestions || !suggestions.length || suggestions[0] === "") {
        suggestions = [];
        suggestions[0] = $$typo;
      }
      for (var i = 0; i < suggestions.length; i++) {
        suggestions[i] = livespell.str.toCase(suggestions[i], 0, true);
      }
    }
    if (
      !suggestions ||
      !suggestions.length ||
      suggestions[0] === "" ||
      reason == "R"
    ) {
      oS.disabled = true;
    } else {
      oS.disabled = false;
      if (reason === "X" && spellWin.provider().isUniPacked) {
        suggestions = new Array(
          "JavaScriptSpellCheck Trial",
          "Please register online",
          "javascriptspellcheck.com"
        );
      }
      for (var i = 0; i < suggestions.length; i++) {
        if (reason === "X") {
          oS.options[i] = new Option(
            suggestions[i],
            "__*REG*__",
            i == 0,
            i == 0
          );
        } else {
          oS.options[i] = new Option(
            suggestions[i],
            suggestions[i],
            i == 0,
            i == 0
          );
        }
      }
    }
    this.ui.enable(
      "btnIgnore,btnIgnoreAll,btnAddToDict,btnChange,btnChangeAll,btnAutoCorrect,btnShowOptions",
      true
    );
    if (reason == "X") {
      this.ui.enable(
        "btnIgnoreAll,btnAddToDict,btnChangeAll,btnAutoCorrect",
        false
      );
    }
    this.ui.show("lMeaning", false);
    this.ui.enable("btnUndo", this.undo.bookmarks.length > 0);
    switch (reason) {
      case "C":
        E$("fldTextInputLab").innerHTML = spellWin.lang.fetch("REASON_CASE");
        break;
      case "R":
        E$("fldTextInputLab").innerHTML =
          spellWin.lang.fetch("REASON_REPEATED");
        oS.options.length = 0;
        oS.options[0] = new Option(
          spellWin.lang.fetch("SUGGESTIONS_DELETE_REPEATED"),
          "__*DEL*__",
          false,
          true
        );
        this.ui.enable(
          "btnIgnoreAll,btnAddToDict,btnChangeAll,btnAutoCorrect,fldSuggestions",
          false
        );
        break;
      case "G":
        E$("fldTextInputLab").innerHTML = spellWin.lang.fetch("REASON_GRAMMAR");
        this.ui.enable(
          "btnIgnoreAll,btnAddToDict,btnChangeAll,btnAutoCorrect",
          false
        );
        break;
      default:
        if (reason === "B") {
          E$("fldTextInputLab").innerHTML =
            spellWin.lang.fetch("REASON_BANNED");
          if (spellWin.provider().Strict) {
            this.ui.enable("btnIgnore,btnIgnoreAll,btnAddToDict", false);
          }
        } else if (reason === "E") {
          E$("fldTextInputLab").innerHTML =
            spellWin.lang.fetch("REASON_ENFORCED");
          this.ui.enable("btnIgnore,btnIgnoreAll,btnAddToDict", false);
        } else {
          E$("fldTextInputLab").innerHTML =
            spellWin.lang.fetch("REASON_SPELLING");
        }
        if (!suggestions.length || suggestions[0] == "") {
          oS.options[0] = new Option(
            spellWin.lang.fetch("SUGGESTIONS_NONE"),
            $$typo,
            false,
            true
          );
          this.ui.enable("btnChange,btnChangeAll,btnAutoCorrect", false);
        } else {
          if (spellWin.provider().ShowMeanings && !livespell.test.FireFox()) {
            this.ui.show("lMeaning", true);
          }
        }
        break;
    }
    spellWin.provider().docFocus(spellWin.currentDoc);
  },
  FindNextTypo: function () {
    for (var i = this.currentDoc; i < this.tokens.value.length; i++) {
      for (
        var j = i === this.currentDoc ? this.currentToken : 0;
        j < this.tokens.value[i].length;
        j++
      ) {
        if (this.tokens.isWord(i, j)) {
          var word = this.tokens.value[i][j];
          var spelltest = livespell.test.spelling(
            word,
            spellWin.provider().Language
          );
          var unknown = spelltest !== true && spelltest !== false;
          if (unknown) {
            spellWin.regroup(false);
            return null;
          }
          if (!spelltest) {
            var reason = livespell.cache.reason[spellWin.provider().Language][
              word
            ]
              ? livespell.cache.reason[spellWin.provider().Language][word]
              : "";
            if (
              spellWin.provider().IgnoreAllCaps &&
              livespell.test.ALLCAPS(word) &&
              reason !== "B" &&
              reason !== "E"
            ) {
              spelltest = true;
            }
            if (
              spellWin.provider().IgnoreNumeric &&
              livespell.test.num(word) &&
              reason !== "B" &&
              reason !== "E"
            ) {
              spelltest = true;
            }
            if (!spellWin.provider().CaseSensitive && reason == "C") {
              spelltest = true;
            }
          }
          if (
            spellWin.provider().CheckGrammar &&
            !spellWin.tokens.startsSentence(i, j) &&
            j > 1 &&
            spellWin.tokens.value[i][j].toUpperCase() ===
              spellWin.tokens.value[i][j - 2].toUpperCase()
          ) {
            if (
              spellWin.tokens.value[i][j].toUpperCase() !=
              spellWin.tokens.value[i][j].toLowerCase()
            ) {
              spelltest = false;
              reason = "R";
            }
          }
          if (
            spelltest &&
            spellWin.provider().CaseSensitive &&
            spellWin.provider().CheckGrammar &&
            spellWin.tokens.startsSentence(i, j) &&
            livespell.test.lcFirst(word)
          ) {
            var strDoc = this.tokens.value[i].join(" ");
            if (
              strDoc.indexOf(".") > 0 ||
              strDoc.indexOf("!") > 0 ||
              strDoc.indexOf("?") > 0 ||
              strDoc.length > 50
            ) {
              spelltest = false;
              reason = "G";
            }
          }
          if (!spelltest) {
            this.currentDoc = i;
            this.currentToken = j;
            this.currentReason = reason;
            var nextWord = this.tokens.value[i][j];
            return nextWord;
          }
        }
      }
    }
    spellWin.ui.finished();
    return null;
  },
  sendInitialAJAXRequest: function (binisrepeat) {
    if (binisrepeat) {
      livespell.ajax.send(
        "WINSETUP",
        livespell.cache.wordlist[spellWin.providerID].join(
          livespell.str.chr(1)
        ),
        spellWin.provider().Language,
        "5",
        spellWin.providerID
      );
    } else {
      livespell.ajax.send(
        "WINSETUP",
        livespell.cache.wordlist[spellWin.providerID].join(
          livespell.str.chr(1)
        ),
        spellWin.provider().Language,
        "0",
        spellWin.providerID
      );
    }
  },
  tokenize: function () {
    for (var i = 0; i < this.docs.length; i++) {
      this.tokens.value[i] = livespell.str.tokenize(this.docs[i]);
    }
  },
  buildWordQue: function () {
    var memsize = 0;
    var memmax = livespell.maxURI - 128;
    livespell.cache.wordlist[spellWin.providerID] = [];
    for (var i = 0; i < this.tokens.value.length && memsize < memmax; i++) {
      for (
        var j = 0;
        j < this.tokens.value[i].length && memsize < memmax;
        j++
      ) {
        var spelltest = true;
        spelltest = livespell.test.spelling(
          this.tokens.value[i][j],
          spellWin.provider().Language
        );
        var unknown = spelltest !== true && spelltest !== false;
        if (this.tokens.isWord(i, j) && !spelltest && unknown) {
          memsize += this.tokens.value[i][j].toString().length;
          livespell.cache.wordlist[spellWin.providerID] =
            livespell.array.safepush(
              livespell.cache.wordlist[spellWin.providerID],
              this.tokens.value[i][j].toString()
            );
        }
      }
    }
    this.suggestionsInMotion = memsize < memmax;
  },
  handshake: function () {
    if (window.opener) {
      livespell = window.opener.livespell;
    } else if (window.parent != window) {
      livespell = window.parent.livespell;
    } else {
      livespell = dialogArguments.livespell;
    }
    spellWin.providerID = spellWin.querystring.get("instance");
    spellWin.provider().spellWindowObject = spellWin;
  },
  setTheme: function () {
    var strTheme = spellWin.provider().CSSTheme;
    if (strTheme.length) {
      E$("theme").setAttribute(
        "href",
        "themes/" + strTheme + "/dialog-window.css"
      );
    }
  },
  hideButtons: function () {
    if (spellWin.provider().AddWordsToDictionary == "NONE") {
      E$("btnAddToDict").style.display = "none";
    }
    var arrHideButtons = spellWin.provider().HiddenButtons.split(",");
    for (var i = 0; i < arrHideButtons.length; i++) {
      var strBtn = arrHideButtons[i];
      try {
        var oBtn = E$(strBtn);
        if (oBtn && oBtn.value) {
          oBtn.style.display = "none";
        }
      } catch (e) {}
    }
  },
  pickup: function () {
    this.docs = spellWin.provider().docPickup();
  },
  querystring: {
    get: function (request) {
      var query = window.location.search.substring(1);
      var vars = query.split("&");
      for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == request) {
          return pair[1];
        }
      }
    },
  },
  ui: {
    setGrammar: function () {
      spellWin.provider().CheckGrammar = E$("optSentence").checked;
      spellWin.moveNext();
    },
    setLoadingMessage: function () {
      E$("fldTextInputLab").innerHTML = "";
      setTimeout(this.setLoadingMessageTimed, 400);
    },
    setLoadingMessageTimed: function () {
      if (E$("fldTextInputLab").innerHTML !== "") {
        return;
      }
      E$("fldTextInputLab").innerHTML = "<div id='ajaxLoader' ></div>";
    },
    finished: function () {
      this.show("optForm,SpellForm", false);
      if (!spellWin.provider().ShowSummaryScreen) {
        return spellWin.actions.done();
      }
      spellWin.allDone = true;
      E$("tDoc").innerHTML =
        spellWin.lang.fetch("DONESCREEN_FIELDS") +
        " " +
        spellWin.tokens.value.length;
      E$("tEdi").innerHTML =
        spellWin.lang.fetch("DONESCREEN_EDITS") + " " + spellWin.editcount;
      E$("tWrd").innerHTML =
        spellWin.lang.fetch("DONESCREEN_WORDS") +
        " " +
        spellWin.tokens.countWords();
      this.show("doneForm", true);
    },
    setupLanguageMenu: function () {
      E$("fldLanguage").options.length = 0;
      E$("fldLanguageMultiple").options.length = 0;
      var ffound = false;
      for (var l = 0; l < livespell.cache.langs.length; l++) {
        E$("fldLanguage")[l] = new Option(
          livespell.cache.langs[l],
          livespell.cache.langs[l],
          false,
          spellWin.provider().Language == livespell.cache.langs[l]
        );
        E$("fldLanguageMultiple")[l] = new Option(
          livespell.cache.langs[l],
          livespell.cache.langs[l],
          false,
          spellWin.provider().Language == livespell.cache.langs[l]
        );
        if (spellWin.provider().Language === livespell.cache.langs[l]) {
          ffound = true;
        }
      }
      E$("fldLanguage")[l] = new Option(
        spellWin.lang.fetch("LANGUAGE_MULTIPLE"),
        spellWin.lang.fetch("LANGUAGE_MULTIPLE"),
        false,
        false
      );
      if (ffound !== true) {
        E$("fldLanguage").options.add(
          new Option(
            spellWin.provider().Language,
            spellWin.provider().Language,
            true,
            true
          ),
          0
        );
        E$("fldLanguage").selectedIndex = 0;
      }
    },
    lookupMeaning: function () {
      var word = spellWin.ui.getMenuValue("fldSuggestions");
      if (word == "__*REG*__") {
        word = "registration";
      }
      var url = spellWin.provider().MeaningProvider.replace("{word}", word);
      if (window.opener && livespell.test.IE()) {
        window.opener.open(url);
      } else {
        window.open(url);
      }
    },
    disableAll: function () {
      this.showEdit(false);
      this.enable(
        "btnIgnore,btnIgnoreAll,btnAddToDict,btnChange,btnChangeAll,btnAutoCorrect,btnUndo,btnShowOptions",
        false
      );
    },
    enable: function (elements, flag) {
      if (!elements.join) {
        var elements = elements.split(",");
      }
      for (var i = 0; i < elements.length; i++) {
        try {
          E$(elements[i]).disabled = !flag;
        } catch (e) {}
      }
    },
    show: function (elements, flag) {
      if (!elements.join) {
        var elements = elements.split(",");
      }
      for (var i = 0; i < elements.length; i++) {
        E$(elements[i]).style.display = flag ? "block" : "none";
      }
    },
    selectEditorText: function (e, start, end) {
      e.focus();
      if (e.setSelectionRange) e.setSelectionRange(start, end);
      else if (e.createTextRange) {
        e = e.createTextRange();
        e.collapse(true);
        e.moveEnd("character", end);
        e.moveStart("character", start);
        e.select();
      }
    },
    editingNow: false,
    showEdit: function (flag) {
      if (this.editingNow == flag) {
        return null;
      }
      if (flag) {
        var oApp = spellWin.tokens.appetureText(
          spellWin.currentDoc,
          spellWin.currentToken
        );
        E$("fldTextInput").value = oApp.text;
        if (oApp.start > -1 && oApp.end > -1) {
          this.selectEditorText(E$("fldTextInput"), oApp.start, oApp.end);
        }
      } else {
        E$("fldTextInput").value = "";
      }
      this.editingNow = flag;
      this.show("TextShow", !flag);
      this.show("btnUndoManualEdit", flag);
      this.enable(
        "btnIgnore,btnIgnoreAll,btnAddToDict,btnChangeAll,btnAutoCorrect,btnShowOptions,fldSuggestions",
        !flag
      );
      if (flag) {
        this.enable("btnChange", true);
        E$("fldTextInput").focus();
      } else {
        spellWin.moveNext();
      }
      return null;
    },
    getMenuValue: function (id) {
      var o = E$(id);
      if (!o.multiple) {
        if (o.selectedIndex === null || o.selectedIndex < 0) {
          return "";
        }
        return o.options[o.selectedIndex].value;
      } else {
        var selVals = new Array();
        for (var i = 0; i < o.length; i++) {
          if (o.options[i].selected) {
            selVals.push(o.options[i].value);
          }
        }
        return selVals.join(",");
      }
    },
  },
};
window.iclose = function () {
  var parentWin = window.opener || window.parent;
  if (spellWin.provider().WindowMode.toLowerCase() == "modalbox") {
    parentWin.parent.Modalbox.hide();
  }
  if (spellWin.provider().WindowMode.toLowerCase() == "fancybox") {
    parentWin.$.fancybox.close();
  }
  if (
    spellWin.provider().WindowMode.length > 8 &&
    spellWin.provider().WindowMode.toLowerCase().substr(0, 9) == "jquery.ui"
  ) {
    parentWin.$("#livespell_jquery_ui_modal").dialog("close");
  }
  window.close();
};
function AjaxConnection() {
  var xmlHttp = null;
  xmlHttp = GetXmlHttpObject();
  if (!xmlHttp && typeof XMLHttpRequest != "undefined")
    xmlHttp = new XMLHttpRequest();
  return xmlHttp;
}
function GetXmlHttpObject() {
  var objXMLHttp = null;
  if (window.XMLHttpRequest) objXMLHttp = new XMLHttpRequest();
  else if (window.ActiveXObject)
    objXMLHttp = new ActiveXObject("Microsoft.XMLHTTP");
  return objXMLHttp;
}
function RemoveFromServer() {
  var xmlHttp = AjaxConnection();
  var winPath = WinLocation();
  if (winPath.length == "") return;
  var url =
    winPath +
    "JavaScriptSpellCheck/core/default.asp?note=0&command=ResetCustomDictionary&args=&lan=English Medical&sender=1&settingsfile=default-settings";
  xmlHttp.open("GET", url, false);
  // Setup a function for the server to run when it's done
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4) {
      if (xmlHttp.status == 200) {
      }
    }
  };
  // Send the request
  xmlHttp.send(null);
}
function GetUserSettings() {
  var xmlHttp = AjaxConnection();
  var winPath = WinLocation();
  if (winPath.length == "") return;
  var url =
    winPath +
    "JavaScriptSpellCheck/core/default.asp?note=0&command=UserSpellChekerRights&args=&lan=English Medical&sender=1&settingsfile=default-settings";
  xmlHttp.open("GET", url, false);
  // Setup a function for the server to run when it's done
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4) {
      if (xmlHttp.status == 200) {
        if (xmlHttp.responseText == "CHECKALL") {
          E$("optCaseSensitive").checked = true;
          E$("optAllCaps").checked = true;
          E$("optNumeric").checked = true;
        } else {
          status = xmlHttp.responseText;
          statusArray = status.split("|");

          if (statusArray[0] == "True") E$("optCaseSensitive").checked = true;
          else E$("optCaseSensitive").checked = false;

          if (statusArray[1] == "True") E$("optAllCaps").checked = true;
          else E$("optAllCaps").checked = false;

          if (statusArray[2] == "True") E$("optNumeric").checked = true;
          else E$("optNumeric").checked = false;
        }
      }
    }
  };
  // Send the request
  xmlHttp.send(null);
}

function SetSpellCheckerUserSettings() {
  var xmlHttp = AjaxConnection();
  var winPath = WinLocation();
  if (winPath.length == "") return;
  var url =
    winPath +
    "JavaScriptSpellCheck/core/default.asp?isCaseSensitive=" +
    E$("optCaseSensitive").checked +
    "&isIgnoreAllCaps=" +
    E$("optAllCaps").checked +
    "&isIgnoreWordsWithNumbers=" +
    E$("optNumeric").checked +
    "&note=0&command=UpdateUserSpellChekerRights&args=&lan=English Medical&sender=1&settingsfile=default-settings";
  xmlHttp.open("GET", url, false);
  // Setup a function for the server to run when it's done
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4) {
      if (xmlHttp.status == 200) {
        if (xmlHttp.responseText == "1") {
        }
      }
    }
  };
  // Send the request
  xmlHttp.send(null);
}
function GetAddToDictionaryWordsCount() {
  var xmlHttp = AjaxConnection();
  var winPath = WinLocation();
  if (winPath.length == "") return;
  var url =
    winPath +
    "JavaScriptSpellCheck/core/default.asp?note=0&command=GetAddToDictionaryWordsCount&args=&lan=English Medical&sender=1&settingsfile=default-settings";
  xmlHttp.open("GET", url, false);
  // Setup a function for the server to run when it's done
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4) {
      if (xmlHttp.status == 200) {
        var count = xmlHttp.responseText;
        if (count && count > 0) {
          var token = "temp_" + new Date().getTime();
          livespell.userDict.add(token);
        } else count = 0;
      }
    }
    spellWin.optionsMenu.loadCount(count);
  };
  // Send the request
  xmlHttp.send(null);
}
function WinLocation() {
  var result = "";
  var url = window.location.href;
  if (url && url.length > 0) {
    var arr = url.split("/");
    if (arr && arr.length > 0) {
      result = arr[0] + "//" + arr[2] + "/" + arr[3] + "/";
    }
  }
  return result;
}

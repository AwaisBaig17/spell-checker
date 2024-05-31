<%
Option Explicit
Dim LicenseKey, SaveToCentralDictionary
%>
<!--#include file="asp/ASPSpellClass.asp"-->
<!--#include file="settings/default-settings.asp"-->
<%	
Server.ScriptTimeout=30   
Response.Expires = 0
Response.Expiresabsolute = Now() - 1
Response.AddHeader "pragma","no-cache"
Response.AddHeader "cache-control","private"
Response.CacheControl = "no-cache" 
		
Dim sent_langs, objASPSpell, objASPSpellDYM,lang, arrLangs, note, script, sender, args, i, dlimit1, dlimit2, dlimit5, command, words, suggestcountinit, error_type_words(), spell_check_words(), suggest_words(), maxsuglength, suggestcount, word, ok, doSuggest, centralDictionaryFile,  OpenFileobj, FSOobj,FilePath, centralDictionaryFilePath, sValid
Dim objClinicalDocument
Dim rsUserCustomDictionary
Dim customUserDictionary
Dim serverPath
Dim list
Dim status

Response.Buffer = True
lang = "English (International)"
note = ""
script = False
sender = ""
args = ""
	
If (Request.QueryString("args")&"" <> "") Then args = Request.QueryString("args")
If (Request.QueryString("lan")&"" <> "") Then lang = Request.QueryString("lan")
If (Request.QueryString("note")&"" <> "") Then note = Request.QueryString("note")
If (Request.QueryString("sender")&"" <> "") Then sender = Request.QueryString("sender")
If (Request.QueryString("script")&"" <> "") Then script = True
If (Request.QueryString("command")&"" <> "") Then command = UCASE(Trim(Request.QueryString("command"))) Else response.write("No Command"):Response.end()
	
Set objClinicalDocument = server.createobject("CureMD_EHR.clsClinical_Documents")
Dim isCaseSensitive,isIgnoreAllCaps,isIgnoreWordsWithNumbers
isCaseSensitive=False
isIgnoreAllCaps=False
isIgnoreWordsWithNumbers=False
If (LCase(Request("command")) = "userspellchekerrights") Then
    Dim rsUserSpellCheckerSettings
    Set rsUserSpellCheckerSettings = objClinicalDocument.GetUserSpellCheckerSettings(Application.Contents.Item("vchServer_Name"),Session.Contents.Item("vchCureMD_Database"),Session.Contents.item("intPractice_ID"),Session.Contents.Item("intUser_ID"))
    If rsUserSpellCheckerSettings.recordcount > 0 Then
        status = rsUserSpellCheckerSettings("isCaseSensitive") & "|" & rsUserSpellCheckerSettings("isIgnoreAllCaps") & "|" & rsUserSpellCheckerSettings("isIgnoreWordsWithNumbers")
    Else
        status = "CHECKALL"
    End If
    Response.Write status
    Set rsUserSpellCheckerSettings = Nothing
    Set objClinicalDocument = Nothing
    Response.End
ElseIf (LCase(Request("command")) = "updateuserspellchekerrights") Then
    status = objClinicalDocument.SetUserSpellCheckerSettings(Application.Contents.Item("vchServer_Name"),Session.Contents.Item("vchCureMD_Database"),Session.Contents.item("intPractice_ID"),Session.Contents.Item("intUser_ID"),Request("isCaseSensitive"),Request("isIgnoreAllCaps"),Request("isIgnoreWordsWithNumbers"))
    Response.Write status
    Set objClinicalDocument = Nothing
    Response.End
ElseIf (Request("command") ="ResetCustomDictionary") Then
    status=objClinicalDocument.ResetMedicalSpellCheckDictionary(Application.Contents.Item("vchServer_Name"),Session.Contents.Item("vchCureMD_Database"),Session.Contents.item("intPractice_ID"),Session.Contents.Item("intUser_ID"))
    Response.Write status
    Set objClinicalDocument = Nothing
    Response.End
End If

Set list = CreateObject("System.Collections.ArrayList")
Set objASPSpell = ASPSpellObjectProvider.Create("aspspellcheck")
If (command <> "SAVEWORD") Then
    Set rsUserCustomDictionary = objClinicalDocument.GetSpellCheckDictionary(Application.Contents.Item("vchServer_Name"),Session.Contents.Item("vchCureMD_Database"),Session.Contents.item("intPractice_ID"),Session.Contents.Item("intUser_ID"))
    If rsUserCustomDictionary.recordcount <> 0 Then 
		on error resume next
        Dim vText
        Do While not rsUserCustomDictionary.EOF
            vText = rsUserCustomDictionary.fields("vText")
            If vText <> "" Then
                list.Add LCase(vText)
            End If
            rsUserCustomDictionary.MoveNext
		Loop
		on error goto 0
    End If
End If

objASPSpell.ignoreCaseMistakes = False
objASPSpell.ignoreAllCaps = False
objASPSpell.IgnoreNumeric = False
objASPSpell.IgnoreEmailAddresses = False
objASPSpell.IgnoreWebAddresses = False
objASPSpell.newLineNewSentance = False
objASPSpell.LicenseKey = LicenseKey
objASPSpell.DictionaryPath = (replace(LCASE(Request.ServerVariables("PATH_INFO")),"core/default.asp","dictionaries/"))+""
objASPSpell.AddCustomDictionary("custom.txt")
objASPSpell.LoadCustomBannedWords("language-rules/banned-words.txt")
	
If (Request("command") ="GetAddToDictionaryWordsCount") Then
    response.write list.count
    response.End
End If

dlimit1 = chr(1)
dlimit2 = chr(2)
dlimit5 = chr(5)
arrLangs = Split(lang,",")
For i=0 to UBound(arrLangs)
    objASPSpell.AddDictionary(trim(arrLangs(i)))
Next
	
If (command = "SAVEWORD") Then
	Response.Write ("SAVEWORD")
    Response.Write (dlimit5)
    Response.Write (sender) 
    Response.Write (dlimit5) 
    If( NOT SaveToCentralDictionary) Then response.write "!! SaveToCentralDictionary Must be set true in core/settings/default-settings.asp line 2 to allow for a centralized 'add to dictionary'" : response.end()
    status = objClinicalDocument.InsertToMedicalSpellCheckDictionary(Application.Contents.Item("vchServer_Name"),Session.Contents.Item("vchCureMD_Database"),Session.Contents.item("intPractice_ID"),Session.Contents.Item("intUser_ID"),args,lang,JOIN(objASPSpell.ListDictionaries(),","))
    If err.number <>0 then response.write 	"!!Word not saved - "&centralDictionaryFile&" unwritable. Check the permissions for IUSER" : response.end()
    response.write	args&" saved to the custom dictionary."
ElseIf (command = "WINSETUP") Then
    words = split(args,dlimit1)
    suggestcountinit = 3
	redim error_type_words (Ubound(words))
	redim spell_check_words (Ubound(words))
	redim suggest_words (Ubound(words))
	maxsuglength = 0
	suggestcount = 0
	For i = 0 to UBound(words) 
    	error_type_words(i) = ""
		If (suggestcount < suggestcountinit + 1) Then suggest_words(i) = ""
		If ( SpellCheckCustom(words(i))) Then
			spell_check_words(i) = "T"
		Else
			spell_check_words(i) = "F"
			error_type_words(i) = objASPSpell.ErrorTypeWord(words(i))
			If (suggestcount < suggestcountinit + 1) Then
			    suggestcount = suggestcount + 1
			    suggest_words(i) = Join(Fetch_Suggestions(words(i)), dlimit2)
			    maxsuglength = i + 1
			End If
		End if
	Next
	redim preserve  suggest_words (maxsuglength) 
	Response.Write ("WINSETUP")
	Response.Write (dlimit5)
	Response.Write (sender) 
	Response.Write (dlimit5) 
	Response.Write (JOIN( spell_check_words,""))
	Response.Write (dlimit5) 
	Response.Write (JOIN( error_type_words,dlimit1)) 
	Response.Write (dlimit5) 
	Response.Write (JOIN( suggest_words,dlimit1)) 
	Response.Write (dlimit5) 
	Response.Write (JOIN(objASPSpell.ListDictionaries(),dlimit2))
ElseIF (command = "LISTDICTS") Then
    Response.Write ("WINSETUP")
    Response.Write (dlimit5)
    Response.Write (sender)
    Response.Write (dlimit5)
    Response.Write (JOIN(objASPSpell.ListDictionaries(),dlimit2))
ElseIf (command ="WINSUGGEST") Then
    words = split(args,dlimit1)
    redim suggest_words (UBound(words))
    For i = 0 to UBound(words) 
	    suggest_words(i) = Join(Fetch_Suggestions(words(i)), dlimit2)
	Next
	Response.Write "WINSUGGEST"
	Response.Write dlimit5
	Response.Write sender 
	Response.Write dlimit5
    Response.Write (JOIN(suggest_words,dlimit1)) 
Elseif (command ="CTXSPELL") Then
    words = split(args,dlimit1)
	redim error_type_words (Ubound(words))
	redim spell_check_words (Ubound(words))
	redim suggest_words (Ubound(words))
    For i = 0 to UBound(words)
	    error_type_words(i) ="-"
	    If ( SpellCheckCustom(words(i))) Then
		    spell_check_words(i) = "T"
	    Else
		    spell_check_words(i) = "F"
		    error_type_words(i) =  objASPSpell.ErrorTypeWord(words(i))
	    End If
    Next
    Response.Write ("CTXSPELL")
    Response.Write (dlimit5)
    Response.Write (sender)
    Response.Write (dlimit5)
    Response.Write (JOIN( spell_check_words,""))
    Response.Write (dlimit5) 
    Response.Write (JOIN( error_type_words,dlimit1))
ElseIf (command ="CTXSUGGEST") Then
    word = args
    Response.Write ("CTXSUGGEST")
    Response.Write (dlimit5)
    Response.Write (sender)
    Response.Write (dlimit5)
    Response.Write (Join( Fetch_Suggestions(args), dlimit2))
    If (note="ADDLANGS") Then
        Response.Write (dlimit5)
        Response.Write(JOIN( objASPSpell.ListDictionaries(),dlimit2))
    End if
ElseIf (command ="RAWSPELL") Then
    word = args
    ok = SpellCheckCustom(word)
    Response.Write ("RAWSPELL")
    Response.Write (dlimit5)
    Response.Write (sender)
    Response.Write (word)
    Response.Write (sender)
    Response.Write (dlimit5)
    If (ok) Then Response.Write ("T") Else Response.Write ("F")
    Response.Write (dlimit5)
    If (ok) Then
        Response.Write (word)
        Response.Write (dlimit5)
        Response.Write ("")
    Else
     	Response.Write (Join(Fetch_Suggestions(word), dlimit2))
		Response.Write (dlimit5)
		Response.Write objASPSpell.ErrorTypeWord(word)
	End If
ElseIf (command ="APISPELL" OR command ="APISPELLARRAY") Then
    words = split(args,dlimit1)
    doSuggest = (note<>"NOSUGGEST")
    redim error_type_words (UBound(words))
    redim spell_check_words (UBound(words))
    redim suggest_words (UBound(words))

    For i = 0 to UBound(words)
        error_type_words(i) = ""
  	    If (SpellCheckCustom(words(i))) Then
		    spell_check_words(i) = "T"
		Else
		    spell_check_words(i) = "F"
		    error_type_words(i) = objASPSpell.ErrorTypeWord(words(i))
			If (doSuggest) Then
		 	    suggest_words(i) = Join( Fetch_Suggestions(words(i)), dlimit2)
			Else
		 	    suggest_words(i) = ""
			End If
	    End If
    Next
    Response.Write (command)
    Response.Write (dlimit5)
    Response.Write (sender)
    Response.Write (dlimit5)
    Response.Write (JOIN( spell_check_words,""))
    Response.Write (dlimit5)
    Response.Write (JOIN( error_type_words,dlimit1))
    Response.Write (dlimit5)
    Response.Write (JOIN( suggest_words,dlimit1))
    Response.Write (dlimit5)
    Response.Write (JOIN( words,dlimit1))
ElseIf (command ="APIDYM" ) Then
	Set objASPSpellDYM = ASPSpellObjectProvider.Create("aspdidyoumean")
	objASPSpellDYM.setInstallPath( (replace(LCASE(Request.ServerVariables("PATH_INFO")),"core/default.asp","dictionaries/"))+"")
	objASPSpellDYM.setSugguestionsLimit(1)
	arrLangs = Split(lang,",")
	For i=0 to UBound(arrLangs)
		objASPSpellDYM.AddDictionary(trim(arrLangs(i)))
	Next
    Response.Write ("APIDYM")
    Response.Write (dlimit5)
    Response.Write (sender)
    Response.Write (dlimit5)
    Response.Write (args)
    Response.Write (dlimit5)
    Response.Write (objASPSpellDYM.SuggestionString(args))
    Response.Write (dlimit5)
    Response.Write (lang)
ElseIf (command ="APIVALIDATE") Then
    words = split(args,dlimit1)
    objASPSpell.ignoreCaseMistakes  = (note="CASESENSITVE")
    redim error_type_words (Ubound(words))
    redim spell_check_words (Ubound(words))
    sValid = "T"
    For i = 0 to UBound(words) 
	    error_type_words(i) = ""
  	    If (SpellCheckCustom(words(i))) Then
		    spell_check_words(i) = "T"
		Else
		    spell_check_words(i) = "F"
		    sValid = "F"
		    error_type_words(i) =  objASPSpell.ErrorTypeWord(words(i))
		End If
    Next
    Response.Write (command)
    Response.Write (dlimit5)
    Response.Write (sender)
    Response.Write (dlimit5)
    Response.Write (JOIN( spell_check_words,""))
    Response.Write (dlimit5)
    Response.Write (JOIN( error_type_words,dlimit1))
    Response.Write (dlimit5)
    Response.Write (JOIN( words,dlimit1))
    Response.Write (dlimit5)
    Response.Write (sValid)
End If

Set objClinicalDocument = Nothing

If (script) Then response.write ("<script type=""text/javascript"">window.parent.livespell.ajax.pickupIframe(document.body.innerHTML); </script>")
Response.flush
response.end()

Function Fetch_Suggestions (word)
    on error resume next
	Fetch_Suggestions = objASPSpell.Suggestions(word)
	If err.number >0 then Fetch_Suggestions = split("","-")
    on error goto 0
End Function

Function SpellCheckCustom(word)
    Dim isFound
    isFound = false
    on error resume next
        IF (objASPSpell.SpellCheck(word)) Then
            isFound=true
        Else
            If (list.count > 0) Then
                If (list.IndexOf(LCase(word), 0) <> -1) Then
                   isFound=true
                End if
            End If
        End If
    SpellCheckCustom=isFound
    on error goto 0
End Function
%>
import { Component, OnInit, ViewChild} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import {AppService, Emoji} from '../app.service';

@Component({
  selector: 'app-markdown',
  templateUrl: './markdown.component.html',
  styleUrls: ['./markdown.component.scss'],
  providers: [AppService]
})
export class MarkdownComponent implements OnInit {
  @ViewChild('codeEditor', { static: false }) private codeEditor: CodemirrorComponent;
  @ViewChild('emoji') private emojiContent: NgbModal;
  @ViewChild('help') private helpContent: NgbModal;

  tools: tools[];
  emojis: Emoji[] = [];
  preview: string = "";
  query: string = "";
  editor: CodeMirror.Editor;
  selection: string;
  cursor: CodeMirror.Position;
  line: string;
  pos: number;
  length: number;
  ul: boolean = false;
  ol: boolean = false;
  count: number;
  difference: number;

  /**
   * Map keys to functions
   */
  extraKeys = {
    Enter: () => this.enterKey(),
    "Ctrl-B": () => this.bold(),
    "Ctrl-I": () => this.italic(),
    "Shift-Ctrl-S": () => this.strikethrough(),
    "Ctrl-Q": () => this.quote(),
    "Shift-Ctrl-O": () => this.unordered_list(),
    "Shift-Ctrl-U": () => this.ordered_list(),
    "Shift-Ctrl--": () => this.horizontal_rule(),
  }

  constructor(private modalService: NgbModal, private service: AppService) {}

  ngOnInit(): void {
    this.count = 1;
    this.tools = [
      { type: "Undo", icon: "fas fa-undo", break: false},
      { type: "Redo", icon: "fas fa-redo", break: true},
      { type: "Bold", icon: "fas fa-bold", break: false}, 
      { type: "Italic", icon: "fas fa-italic", break: false},
      { type: "Strikethrough", icon: "fas fa-strikethrough", break: false},
      { type: "Quote", icon: "fas fa-quote-left", break: false},
      { type: "Unordered List", icon: "fas fa-list-ul", break: false},
      { type: "Ordered List", icon: "fas fa-list-ol", break: false},
      { type: "Horizontal Rule", icon: "fas fa-minus", break: true},
      { type: "H1", icon: "heading-icon h1", break: false},
      { type: "H2", icon: "heading-icon h2", break: false},
      { type: "H3", icon: "heading-icon h3", break: false},
      { type: "H4", icon: "heading-icon h4", break: false},
      { type: "H5", icon: "heading-icon h5", break: false},
      { type: "H6", icon: "heading-icon h6", break: true},
      { type: "Emoji", icon: "fas fa-laugh", break: false},
    ];
    this.getEmojisFromService();
  }

  /**
   * Get the list of Emojis from the app service, put into array of Emoji objects
   */
  private getEmojisFromService():void {
    this.service.getEmojis().subscribe(emoji => {
      for (const [key, value] of Object.entries(emoji)) {
        this.emojis.push({name: ":" + key + ":", url: value, active: false});
      }
    })
  }

  ngAfterViewInit() {
    setTimeout(() => this.setPreview());
  }

  /**
   * Return the function for the tool type clicked
   * @param toolName Name of the tool which matches lowercase function
   */
  callFunction(toolName: string) {  
    var functionName = toolName.toLowerCase().replace(/ /g,"_");
    if(functionName == "h1" || functionName == "h2" || functionName == "h3" || functionName == "h4" || functionName == "h5" || functionName == "h6") {
      var headingNum = parseInt(functionName.charAt(1));
      return this["heading"](headingNum);
    } else if (this[functionName]) {
      return this[functionName]();
    }
  }

  /**
   * Update the preview when there is a change in the codemirror
   */
  updatePreview(): void {
    const editor = this.codeEditor.codeMirror;
    editor.focus();
    this.preview = editor.getValue();
    this.selection = editor.getSelection();
    this.cursor = editor.getCursor();
    this.line = editor.getLine(this.cursor.line);
    this.pos = this.cursor.ch;
    this.length = this.selection.length;
  }
 
  private enterKey() {
    if (this.ul == true && this.ul !==null) {
      this.editor.replaceSelection("\n- ");
    } else if (this.ol == true && this.ol !==null) {
      this.count++;
      console.log(this.cursor.line+1 - this.count);
      if ((this.cursor.line+1 - this.count) == this.difference) {
        this.editor.replaceSelection("\n"+this.count+". ");
      } else {
        this.ordered_list();
        this.editor.replaceSelection("\n");
      }
    } else {
      this.editor.replaceSelection("\n");
    }
  }

  /**
   * Sets the HTML preview to the rendered default source_code
   */
  private setPreview(): void {
    this.editor = this.codeEditor.codeMirror;
    this.editor.setSize("100%", "100%");
    this.editor.focus();
    this.preview = this.editor.getValue();
  }

  undo(): void {
    this.editor.undo();
  }

  redo(): void {
    this.editor.redo();
  }

  bold(): void {
    if (this.selection == "") {   
      this.editor.replaceSelection("**Bold**");
      this.editor.setSelection({line: this.cursor.line, ch: this.cursor.ch-6}, {line: this.cursor.line, ch: this.cursor.ch-2});
    } else if (this.line.charAt(this.pos) == "*" && this.line.charAt(this.pos+1) == "*" && this.line.charAt(this.pos-this.length-1) == "*" && this.line.charAt(this.pos-this.length-2) == "*") {
      this.editor.replaceRange(this.selection, {line: this.cursor.line, ch: this.pos-this.length-2}, {line: this.cursor.line, ch: this.pos+2});
    } else if (this.line.charAt(this.pos-1) == "*" && this.line.charAt(this.pos-2) == "*" && this.line.charAt(this.pos+this.length) == "*" && this.line.charAt(this.pos+this.length+1) == "*") {
      this.editor.replaceRange(this.selection, {line: this.cursor.line, ch: this.pos+this.length+2}, {line: this.cursor.line, ch: this.pos-2});
    } else {
      this.editor.replaceSelection("**" + this.selection + "**");
    }
  }

  italic(): void {
    if (this.selection == "") {      
      this.editor.replaceSelection("*Italic*");
      this.editor.setSelection({line: this.cursor.line, ch: this.cursor.ch-7}, {line: this.cursor.line, ch: this.cursor.ch-1});
    } else if (this.line.charAt(this.pos) == "*" && this.line.charAt(this.pos-this.length-1) == "*") {
      this.editor.replaceRange(this.selection, {line: this.cursor.line, ch: this.pos-this.length-1}, {line: this.cursor.line, ch: this.pos+1});
    } else if (this.line.charAt(this.pos-1) == "*" && this.line.charAt(this.pos+this.length) == "*") {
      this.editor.replaceRange(this.selection, {line: this.cursor.line, ch: this.pos+this.length+1}, {line: this.cursor.line, ch: this.pos-1});
    } else {
      this.editor.replaceSelection("*" + this.selection + "*");
    }
  }

  strikethrough(): void {
    if (this.selection == "") {      
      this.editor.replaceSelection("~~Strikethrough~~");
      this.editor.setSelection({line: this.cursor.line, ch: this.cursor.ch-15}, {line: this.cursor.line, ch: this.cursor.ch-2});
    } else if (this.line.charAt(this.pos) == "~" && this.line.charAt(this.pos+1) == "~" && this.line.charAt(this.pos-this.length-1) == "~" && this.line.charAt(this.pos-this.length-2) == "~") {
      this.editor.replaceRange(this.selection, {line: this.cursor.line, ch: this.pos-this.length-2}, {line: this.cursor.line, ch: this.pos+2});
    } else if (this.line.charAt(this.pos-1) == "~" && this.line.charAt(this.pos-2) == "~" && this.line.charAt(this.pos+this.length) == "~" && this.line.charAt(this.pos+this.length+1) == "~") {
      this.editor.replaceRange(this.selection, {line: this.cursor.line, ch: this.pos+this.length+2}, {line: this.cursor.line, ch: this.pos-2});
    } else {
      this.editor.replaceSelection("~~" + this.selection + "~~");
    }
  }
  
  quote(): void {
    if (this.selection == "") {      
      this.editor.replaceSelection(">Quote");
      this.editor.setSelection({line: this.cursor.line, ch: this.cursor.ch-5}, {line: this.cursor.line, ch: this.cursor.ch});
    } else if (this.line.charAt(this.pos-this.length-1) == ">") {
      this.editor.replaceRange(this.selection, {line: this.cursor.line, ch: this.pos-this.length-1}, {line: this.cursor.line, ch: this.pos+1});
    } else if (this.line.charAt(this.pos-1) == ">") {
      this.editor.replaceRange(this.selection, {line: this.cursor.line, ch: this.pos+this.length}, {line: this.cursor.line, ch: this.pos-1});
    } else {
      this.editor.replaceSelection(">" + this.selection);
    }
  }

  unordered_list(): void {
    this.ul = !this.ul;
    if (this.selection == "") {      
      if (this.ul) {
        this.editor.replaceSelection("- ");
      }
      this.editor.setCursor(this.cursor.line, this.cursor.ch + 2);
    } else {
      this.editor.replaceSelection("- " + this.selection);
    }
  }

  ordered_list(): void {
    this.ol = !this.ol;
    this.count = 1;
    this.difference = this.cursor.line - 1;
    if (this.selection == "") {      
      if (this.ol) {
        this.editor.replaceSelection("1. ");
      }
      this.editor.setCursor(this.cursor.line, this.cursor.ch + 2);
    } else {
      this.editor.replaceSelection("1. " + this.selection);
    }
  }

  horizontal_rule(): void {
    if (this.selection == "") {      
      this.editor.replaceSelection("---\n");
    } else {
      this.editor.replaceSelection("\n---\n");
    }
  }

  heading(n: number): void {
    var hashtag = "#".repeat(n);

    if (this.selection == "") {      
      this.editor.setCursor(this.cursor.line, this.cursor.ch+2);
      this.editor.replaceSelection(hashtag + " H" + n.toString());
    } else {
      this.editor.replaceSelection(hashtag + " " + this.selection);
    }
  }

  helpModal(): void {
    this.modalService.open(this.helpContent, {scrollable: true, centered: true, windowClass: "modal"});
  }

  emoji() {
    this.modalService.open(this.emojiContent, {scrollable: true, centered: true, windowClass: "modal"});
  }

  /**
   * Insert emoji code if active property is set to true
   */
  insertEmoji(): void {
    this.emojis.forEach(emoji => {
      if (emoji.active === true) {
        if (this.selection == "") {      
          this.editor.setCursor(this.cursor.line, this.cursor.ch+2);
          this.editor.replaceSelection(emoji.name);
        } else {
          this.editor.replaceSelection(emoji.name);
        }
        emoji.active = false;
      }
    });
    this.query = "";
    this.modalService.dismissAll();
  }

  /**
   * Toggle the active property each time method is called
   * @param emoji Emoji selected
   */
  selectEmoji(emoji: Emoji): void {
    emoji.active = !emoji.active;
  }

  /**
   * Filter the emojis by search query
   */
  filter(): void {
    let term = this.query;
    const emojisCopy  = Object.assign([], this.emojis);
    this.emojis = emojisCopy.filter(function(tag) {
        return tag.name.indexOf(term) >= 0;
    }); 
  }

  source_code = "# Formatter Tools - Markdown\n----\n1. Click me and edit the markdown.\n2. See rendered HTML!\n----\nReference:"
    +"\n# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6\n\n**strong**\n*emphasis*\n"
}

export interface tools {
  type: string;
  icon: string;
  break: boolean; // Divider
}

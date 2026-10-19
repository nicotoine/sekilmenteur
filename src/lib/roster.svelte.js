export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;

class Roster {
  names = $state(['', '', '']);

  get filled() {
    return this.names.map((n) => n.trim()).filter(Boolean);
  }
  get hasDuplicates() {
    const lower = this.filled.map((n) => n.toLowerCase());
    return new Set(lower).size !== lower.length;
  }
  get isValid() {
    return this.filled.length >= MIN_PLAYERS && !this.hasDuplicates;
  }

  add() {
    if (this.names.length < MAX_PLAYERS) this.names.push('');
  }
  remove(index) {
    if (this.names.length > MIN_PLAYERS) this.names.splice(index, 1);
  }
}

export const roster = new Roster();

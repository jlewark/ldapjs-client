const assert = require('assert-plus');
const LDAPMessage = require('./message');
const { LDAP_REQ_MODRDN } = require('../protocol');
const dn = require('../dn');
const lassert = require('../assert');

module.exports = class ModifyDNRequest extends LDAPMessage {
  constructor(options) {
    options = options || {};
    assert.object(options);
    assert.optionalBool(options.deleteOldRdn);
    lassert.optionalStringDN(options.entry);
    lassert.optionalDN(options.newRdn);
    lassert.optionalDN(options.newSuperior);

    options.protocolOp = LDAP_REQ_MODRDN;
    super(options);

    this.entry = options.entry || null;
    this.newRdn = options.newRdn || null;
    this.deleteOldRdn = options.deleteOldRdn || true;
    this.newSuperior = options.newSuperior || null;
  }

  get type() {
    return 'ModifyDNRequest';
  }

  get _dn() {
    return this.entry;
  }

  _parse(ber) {
    assert.ok(ber);

    this.entry = ber.readString();
    this.newRdn = dn.parse(ber.readString());
    this.deleteOldRdn = ber.readBoolean();
    if (ber.peek() === 0x80)
      this.newSuperior = dn.parse(ber.readString(0x80));

    return true;
  }

  _toBer(ber) {
    ber.writeString(this.entry.toString());
    ber.writeString(this.newRdn.toString());
    ber.writeBoolean(this.deleteOldRdn);
    if (this.newSuperior) {
      const s = this.newSuperior.toString();
      const len = Buffer.byteLength(s);

      ber.writeByte(0x80); // MODIFY_DN_REQUEST_NEW_SUPERIOR_TAG
      ber.writeByte(len);
      ber._ensure(len);
      ber._buf.write(s, ber._offset);
      ber._offset += len;
    }

    return ber;
  }

  _json(j) {
    assert.ok(j);

    j.entry = this.entry.toString();
    j.newRdn = this.newRdn.toString();
    j.deleteOldRdn = this.deleteOldRdn;
    j.newSuperior = this.newSuperior ? this.newSuperior.toString() : '';

    return j;
  }
};
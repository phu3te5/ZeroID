pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";
template ZKLogin() {
    // Input signals
    signal input stid;
    signal input aud;
    signal input iss;
    signal input salt;
    signal input vku;
    signal input T_exp;
    signal input r;
    
    // Output signals
    signal output userComp;
    signal output nonce;

    // userComp = Poseidon(stid, aud, iss, salt)
    component hashUser = Poseidon(4);
    hashUser.inputs[0] <== stid;
    hashUser.inputs[1] <== aud;
    hashUser.inputs[2] <== iss;
    hashUser.inputs[3] <== salt;
    userComp <== hashUser.out;

    // nonce = Poseidon(vku, T_exp, r)
    component hashNonce = Poseidon(3);
    hashNonce.inputs[0] <== vku;
    hashNonce.inputs[1] <== T_exp;
    hashNonce.inputs[2] <== r;
    nonce <== hashNonce.out;
}

// Main component
component main = ZKLogin();
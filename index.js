module.exports.modlang = class modlang {
	constructor(ins) {
		//> Important
		this.stop = false
		this.return = {}
		this.fs = require("fs")
		//> Default
		this.ins = ins ? ins : {}
		if(!this.ins.disable) this.ins.disable = {}
		if(!this.ins.disable.keywords) this.ins.disable.keywords = []
		if(!this.ins.disable.functions) this.ins.disable.functions = []
		if(!this.ins.disable.appenders) this.ins.disable.appenders = []
		//> Support functions
	    this.eval = obj => new Function(`return (${obj})`)()
	    this.check = (key, func, type="keyword") => {
    	    if(!this.ins.disable[type+"s"].includes(key)) func();
    	    else {
    		    this.stop = true;
    		    this.return = { success: false, message: `MODLang <${type.toUpperCase()} REJECTION> | The '${key}' ${type} is disabled` }
    	    }
        }
        this.execute_js = arg => {
        	arg = arg.trim()
        	return new Function(arg
        		.replace(/\$([\w\-\$]+)/gm, (__, c) => {
        			if(this.return.vars) {
        			    if(this.return.vars[c]) return this.return.vars[c];
        				else return __.replace(/\-/gm, "_")
        			} else return __.replace(/\-/gm, "_")
        		})
        	)()
        }
        this.execute_return = arg => {
        	return this.execute_js(`return (${arg})`)
        }
        this.execute_json = arg => {
        	return this.execute_js(`return JSON.stringify(${arg})`)
        }
        this.manage_appenders = (arg) => {
        	return arg
        	.replace(/\{@(exe|x)\s(.*?)@\}/gm, (_, b, a) => {
        		return this.execute_js(a)
        	})
        	.replace(/\{@(exe|x)\s(.*?)\}/gm, (_, b, a) => {
        		return this.execute_js(a)
        	})
        	.replace(/\{@(return|r)\s(.*?)@\}/gm, (_, b, a) => {
        		return this.execute_return(a)
        	})
        	.replace(/\{@(return|r)\s(.*?)\}/gm, (_, b, a) => {
        		return this.execute_return(a)
        	})
        	.replace(/\{@(json|j)\s(.*?)@\}/gm, (_, b, a) => {
        		return this.execute_json(a)
        	})
        	.replace(/\{@(json|j)\s(.*?)\}/gm, (_, b, a) => {
        		return this.execute_json(a)
        	})
        	.replace(/\{@(eval|e)\s(.*?)\}/gm, (_, b, a) => {
        		if(this.return.vars) {
        			a = a.trim()
        			if(a.startsWith("$")) {
        				a = a.substr(1)
        				if(this.return.vars[a]) return this.eval(this.return.vars[a]);
        			    else return _
        			} else return _
        		} else return _
        	})
        	.replace(/\{(.*?)\}/gm, (_, a) => {
        		if(this.return.vars) {
        			a = a.trim()
        			if(a.startsWith("$")) {
        				a = a.substr(1)
        				if(this.return.vars[a]) return this.return.vars[a];
        			    else return _;
        			} else return _;
        		} else return _;
        	})
        }
		//> Logic
	    this.execute_row = ({ cmd, args, arg }) => {
		    if(cmd === "log:") {
			    this.check("log", () => console.log(this.manage_appenders(arg)))
		    } else if(cmd === "print:") {
			    this.check("print", () => {
				   if(!this.return.prints) this.return.prints = []
				   this.return.prints.push(this.manage_appenders(arg))
			    })
		    } else if(cmd.startsWith("$") && cmd.endsWith(":")) {
		    	this.check("vars", () => {
		    		let _cmd = cmd.substr(1, cmd.length - 2)
		    	    if(!this.return.vars) this.return.vars = {}
		    	    this.return.vars[_cmd] = this.manage_appenders(arg)
		    	}, "function")
		    }
	    }
	}
	execute(code) {
		code.replace(/\/\*([\S\s]*?)\*\//gm, "").trim().split("\n").forEach(e => {
			e = e.trim()
			if(this.stop === false) {
				if(e !== "") {
				    let sp = e.split(" "), cmd = sp[0]
				    sp.shift()
				    let args = sp, arg = sp.join(" ")
				    this.execute_row({ cmd, args, arg })
			    } else return
			}
		})
		return this.return;
	}
	async executeFile(loc) {
		try {
			let code = await this.fs.promises.readFile(loc)
			this.execute(code.toString())
			return this.return
		} catch(e) {
			throw e
		}
	}
	executeFileSync(loc) {
		let code = this.fs.readFileSync(loc)
		this.execute(code.toString())
		return this.return
	}
}

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var db;
var db_version = 1;
var db_name = "user_db";

var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },
    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        var e_obj = {};
        database.initialize(db_name, db_version);
        //registers click event [login]
        $("#user_login").click(function(){
            helper.login();
        });
        //registers click event [register]
        $("#user_register").click(function(){
            helper.register();
        });
        $("#c_event").click(function(){
            e_obj.event_name = $('#event_name').val();
            e_obj.event_details = $('#event_det').val();
            if(sessionStorage.getItem("page_status") == "update"){
                console.log(e_obj);
                database.updateEvent(sessionStorage.getItem("o_id"), e_obj);
            }else{
                database.createEvent(e_obj);
                e_obj = {};
            }
            $("[data-id~='event_dataset']").children().remove();
            helper.clearInput(["event_name","event_det"],"#admin_home");
            database.getEvents();
        });

        var picker = new MaterialDatetimePicker({})
            .on('submit', function(d) {
                e_obj.event_datetime = Date.parse(d);
                console.log(e_obj);
            });

        $("#p-date").click(function(e){
            e.preventDefault();
            picker.open();
        });
        $("#delete_event").click(function(e){
            e.preventDefault();
            database.deleteEvent($("#e-name").text());
            $("[data-id~='event_dataset']").children().remove();
            sessionStorage.setItem("page_status", "select");
            window.location.href = "#admin_home";
        });
        $("[href='#login']").click(function(e){
            e.preventDefault();
            database.getEvents();
            window.location.href = "#login";
        });
        $("#edit_event").click(function(e){
            e.preventDefault();
            $('#event_name').val($("#e-name").text());
            $('#event_det').val($("#e-details").text());
            sessionStorage.setItem("page_status", "update");
            $("#c_event").text("Modify");
            window.location.href = "#add_event";
        });
    }
};
var helper = {
    login: function() {
        var obj = {uname: $('#user').val(), pwd: $('#pwd').val()};
        database.getUser(obj);
    },
    register: function() {
        var fname = $("#fname").val();
        var lname = $("#lname").val();
        var username = $("#users").val();
        var password = $("#pwds").val();
        var obj = {user_fname: fname, user_lname: lname, user_uname: username, user_pwd: password, user_role: 'user'};
        database.addUser(obj);
        helper.clearInput(["fname", "lname", "users", "pwds"], "#login");
    },
    clearInput: function(selectors, url = null){
        selectors = Array.isArray(selectors)?selectors:[selectors];
        for(var index = 0; index < selectors.length; index++){
            $("#"+selectors[index]).val("");
        }
        if(url){
            window.location.href = url;
        }
    },
};
var database = {
    initialize: function(dbname, dbversion){
        var request = window.indexedDB.open(dbname, dbversion);
        request.onerror = function(event){
            console.log("Database error: "+event.target.errorCode);
        }
        request.onsuccess = function(event){
            db = this.result;
        }
        request.onupgradeneeded = function(event){
            db = event.target.result;

            var userStore = event.currentTarget.result.createObjectStore("user", {keyPath: "user_id", autoIncrement: true});
            userStore.createIndex("user_fname", "user_fname", {unique: false});
            userStore.createIndex("user_lname", "user_lname", {unique: false});
            userStore.createIndex("user_uname", "user_uname", {unique: true});
            userStore.createIndex("user_pwd", "user_pwd", {unqiue: false});
            userStore.createIndex("user_role", "user_role", {unqiue: false}); 


            var eventStore = event.currentTarget.result.createObjectStore("events", {keyPath: "event_id", autoIncrement: true});
            eventStore.createIndex("event_name", "event_name", {unique: true});
            eventStore.createIndex("event_details", "event_details", {unique: false});
            eventStore.createIndex("event_datetime", "event_datetime", {unique: false});
            
            userStore.transaction.oncomplete = function(event){
                var store = db.transaction('user', 'readwrite').objectStore('user');
                const users = [
                    {'user_fname': 'admin', 'user_lname': 'admin','user_uname': 'admin', 'user_pwd': 'admin', 'user_role': 'admin'},
                    {'user_fname': 'user', 'user_lname': 'user','user_uname': 'user', 'user_pwd': 'user', 'user_role': 'user'}
                ];
                users.forEach(function(user){
                    store.add(user);
                    console.log('Added: '+user.user_uname);
                });  
            }
        }
    },
    addUser: function(obj){
        var user_store = db.transaction("user", "readwrite").objectStore("user");
        user_store.add(obj);
    },
    createEvent: function(obj){
        var event_store = db.transaction("events", "readwrite").objectStore("events");
        event_store.add(obj);
    },
    getUser: function(obj){
        var store = db.transaction("user").objectStore("user");
        store.openCursor().onsuccess = function(event){
            var cursor = event.target.result;
            if(cursor){
                if((cursor.value.user_uname == obj.uname) && (cursor.value.user_pwd == obj.pwd)){
                    obj.user_role = cursor.value.user_role;
                    database.redirectUser(obj);
                }else{
                    // console.log("[ERROR] record not found");
                }
                cursor.continue();
            }
        }
    },
    getEvents: function(){
        var store = db.transaction("events").objectStore("events");
        store.openCursor().onsuccess = function(event){
            var cursor = event.target.result;
            if(cursor){
                database.insertEvent(cursor.value);
                cursor.continue();
            }
        }
    },
    redirectUser: function(obj){
        var path = (obj.user_role == 'user')?"#home":"#admin_home";
        var dis_stat = (obj.user_role == 'user')?"none":"block";
        window.location.href = path;
        database.getEvents();
        $("#user_details").text(obj.uname);
        $("#edit_event").css("display", dis_stat);
        $("#delete_event").css("display", dis_stat);
        sessionStorage.setItem("user_type", obj.user_role);
    },
    insertEvent: function(obj){
        $("[data-id~='event_dataset']").children().remove();
        var linode = document.createElement("li");
        var anode = document.createElement("a");
        var date = new Date(parseInt(obj.event_datetime));
        var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        $(anode).text(obj.event_name);
        $(anode).attr("href", "#");
        $(anode).attr("data-id", obj.event_id);
        $(anode).addClass("ui-btn ui-btn-icon-right ui-icon-carat-r");
        $(linode).append(anode);
        $("[data-id~='event_dataset']").append(linode);
        $("[data-id~='"+obj.event_id+"']").click(function(e){
            e.preventDefault();
            $("#e-name").text(obj.event_name);
            $("#e-details").text(obj.event_details);
            $("#e-date").text("Starts in 2 days");
            sessionStorage.setItem("o_id", obj.event_id);
            window.location.href = "#show_event";
        });
    },
    deleteEvent: function(eventn){
        var store = db.transaction("events").objectStore("events");
        store.openCursor().onsuccess = function(event){
            var cursor = event.target.result;
            if(cursor){
                if(cursor.value.event_name == eventn){
                    var event_store = db.transaction("events", "readwrite").objectStore("events").delete(cursor.key);
                    database.getEvents();
                }
                cursor.continue();
            }
        }
    },
    updateEvent: function(index, set){
        var store = db.transaction("events").objectStore("events");
        store.openCursor().onsuccess = function(event){
            var cursor = event.target.result;
            if(cursor){
                if(cursor.value.event_id == index){
                    var store = db.transaction("events", "readwrite").objectStore("events");
                    var user_store = store.get(cursor.key).onsuccess = function(event){
                        var data = event.target.result;
                        data.event_name = set.event_name;
                        data.event_details = set.event_details;
                        data.event_datetime = set.event_datetime;
                        var req_update = store.put(data);
                    }
                }
                cursor.continue();
            }
        }
    }
};
var database = {
    initialize: function(dbname, dbversion){
        var request = window.indexedDB.open(dbname, dbversion);
        request.onerror = function(event){
            console.log("Database error: "+event.target.errorCode);
        }
        request.onsuccess = function(event){
            db = this.result;
        }
        request.onupgradeneeded = function(event){
            db = event.target.result;

            var userStore = event.currentTarget.result.createObjectStore("user", {keyPath: "user_id", autoIncrement: true});
            userStore.createIndex("user_fname", "user_fname", {unique: false});
            userStore.createIndex("user_lname", "user_lname", {unique: false});
            userStore.createIndex("user_uname", "user_uname", {unique: true});
            userStore.createIndex("user_pwd", "user_pwd", {unqiue: false});
            userStore.createIndex("user_role", "user_role", {unqiue: false}); 


            var eventStore = event.currentTarget.result.createObjectStore("events", {keyPath: "event_id", autoIncrement: true});
            eventStore.createIndex("event_name", "event_name", {unique: true});
            eventStore.createIndex("event_details", "event_details", {unique: false});
            eventStore.createIndex("event_datetime", "event_datetime", {unique: false});
            
            userStore.transaction.oncomplete = function(event){
                var store = db.transaction('user', 'readwrite').objectStore('user');
                const users = [
                    {'user_fname': 'admin', 'user_lname': 'admin','user_uname': 'admin', 'user_pwd': 'admin', 'user_role': 'admin'},
                    {'user_fname': 'user', 'user_lname': 'user','user_uname': 'user', 'user_pwd': 'user', 'user_role': 'user'}
                ];
                users.forEach(function(user){
                    store.add(user);
                    console.log('Added: '+user.user_uname);
                });  
            }
        }
    },{'user_fname': 'admin', 'user_lname': 'admin','user_uname': 'admin', 'user_pwd': 'admin', 'user_role': 'admin'},
                    {'user_fname': 'user', 'user_lname': 'user','user_uname': 'user', 'user_pwd': 'user', 'user_role': 'user'}
					
					
					redirectUser: function(obj){
        var path = (obj.user_role == 'user')?"#home":"#admin_home";
        var dis_stat = (obj.user_role == 'user')?"none":"block";
        window.location.href = path;
        database.getEvents();
        $("#user_details").text(obj.uname);
        $("#edit_event").css("display", dis_stat);
        $("#delete_event").css("display", dis_stat);
        sessionStorage.setItem("user_type", obj.user_role);
    },
app.initialize();
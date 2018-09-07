$(function () {

    function getStationData(cityCode) {

        $.ajax({
            type: 'GET',
            url: "http://siws.transgroup.com/StationInfo.asmx/GetStationInfoJSonIncludeSpecServices",
            crossDomain: true,
            contentType: "application/json; charset=utf-8",
            data: 'cityCode="' + cityCode + '"',
            dataType: "jsonp",
            success: function (response) {
                handleJSonResultsStationInfo(response);
            }
        });
    }

    function handleJSonResultsStationInfo(response) {

        var json = $.parseJSON(response.d);

        //console.log(json);

        LocationModel.loadLocations(json);

        //LocationModel.clearNonCorporateData();
        LocationModel.loadOptions(json);

    }

    $('.columns a', '.right-channel').each(function () {
        var jThis = $(this),
            sHref = jThis.attr('href'),
            cityCode = sHref.substring(sHref.indexOf('cityCode=') + 9, sHref.length);
        jThis.bind('click', function (e) {
            e.preventDefault();
            getStationData(cityCode);
        });
    });

    function isDomestic(CountryGroup) {
        return (CountryGroup == 1 || CountryGroup == 19);
    }

    function getPhoneNumber(stationData, index) {
        var phone = '';
        if (index == 0) {
            sType = 'Local';
        } else if (index == 2) {
            sType = 'Toll-Free';
        } else {
            sType = 'Fax';
        }
        $(stationData.PhoneList).each(function () {
            if (this.PhoneType == sType) {
                phone = this.PhoneNum;
            }
        });

        return phone;
    }
    function AddTheAddress(add, header, footer) {

        strRetVal = "";
        strCityStateZip = "";
        if ((add.City != "") && (add.City != null) && (add.City != "null"))
            strCityStateZip = add.City;

        if ((add.State != "") && (add.State != null) && (add.State != "null")) {
            if ((add.City != "") && (add.City != null) && (add.City != "null"))
                strCityStateZip += ", ";
            strCityStateZip += add.State;
        }

        if ((add.Zip != "") && (add.Zip != null) && (add.Zip != "null"))
            strCityStateZip += " " + add.Zip;

        strAdd2 = "";
        if ((add.Address2 != "") && (add.Address2 != "null") && (add.Address2 != null))
            strAdd2 = "+" + add.Address2;

        strRetVal += (header != "") ? header : "";
	if (add.AddressName.toUpperCase().indexOf('SCAN') >= 0)
	{
	  strRetVal +='<b>SGL TransGroup</b><br/>';
	  strRetVal +='Global Logistics<br/><br/>';
	}
        if ((add.AddressName.toUpperCase().indexOf('CORP') >= 0) ||
	     (add.AddressName.toUpperCase().indexOf('SCAN') >= 0))
            strRetVal += add.AddressName + "<br/>";
        strRetVal += add.Address1 + "<br/>";
        if ((add.Address2 != "") && (add.Address2 != "null") && (add.Address2 != null))
            strRetVal += add.Address2 + "<br/>";
        if (strCityStateZip != "")
            strRetVal += " " + strCityStateZip + "<br/>";

        strRetVal += (footer != "") ? '<br/>' + footer : '';

        return strRetVal;

    }

    var Location = function (data, i) {
        this.mobile = $.browser.mobile;
        staff: ko.observableArray();
        //for (var i = 0; i < data.AddressList.length; i++) {

        switch (data.AddressList[i].AddressType) {
            case 1: //domestic	
                sHeader = "";
                sFooter = "";
                if (
                             (data.MultAddress == "true") &&
			                 (data.CountryGroup == 1 || data.CountryGroup == 19)
			               ) {
                    sHeader = "<div class='almostH3'>Domestic</div>";
                    sFooter = "";
                }
                else {
                    if (data.CountryGroup == 1 || data.CountryGroup == 19)
                        sFooter = "<div class='almostH3'>Domestic</div>";
                    sHeader = "";
                }
                this.address = AddTheAddress(data.AddressList[i], sHeader, sFooter);
                break;
            case 2: //international
                if (data.CountryGroup == 1 || data.CountryGroup == 19) {
                    sHeader = "<div class='almostH3'>International</div>";

                    if ((data.AddressList.length>1) && (data.MultAddress == "false")) {
                        this.address = "<div class='almostH3'>International</div>";
                    }
                    else {
                        if (data.IntlBy != null) {
                            sHeader = "<div class='almostH3'>International</div><b>Services by TransGroup " + data.IntlBy + "</b><br/>";
                        }
                        this.address = AddTheAddress(data.AddressList[i], sHeader, "");
                    }


                }
                else {
                    this.address = AddTheAddress(data.AddressList[i], "", "");
                }
                break;
            case 3: //both
                this.address = AddTheAddress(data.AddressList[i], "<div class='almostH3'>Domestic/International</div>", "");
                break;
            case 4: //Corp
                var a = data.AddressList[i];
                a.AddressName = 'Corporate Headquarters';
                this.address = AddTheAddress(a, "", "");
                break;
            case 6: //tek/projects
                if (data.AddressList[i].AddressName != null)

                    this.address = AddTheAddress(data.AddressList[i], "<div class='almostH3'>" + data.AddressList[i].AddressName + "</div>", "", "");
                break;
            default:
		this.address="";
                break;

        } //switch

        if (i == 0) {
            if (data.CityName != 'CORP')
                this.address = '<div class="almosth2">' + data.CityName + '</div>' +
                    this.address;
            else
                this.address = '<div class="almosth2">Corporate Headquarters</div>' +
                    this.address;
        }

        this.staff = ko.observableArray([]);
        if (data.AddressList[i].Staff.length > 0) {
            for (var j = 0; j < data.AddressList[i].Staff.length; j++) {
                if ((data.AddressList[i].Staff[j].StaffTypeID == 3) ||
                    (data.AddressList[i].Staff[j].StaffTypeID == data.AddressList[i].AddressType))
                    this.staff.push(new Staff(data.AddressList[i].Staff[j]));
            }
        }
        this.staff = sortJSON(this.staff, 'SortId');
        this.phone = ko.observable(getPhoneNumber(data.AddressList[i], 0));
        this.tollfree = ko.observable(getPhoneNumber(data.AddressList[i], 2));
        this.fax = ko.observable(getPhoneNumber(data.AddressList[i], 1));
        this.email = ko.observable(data.AddressList[i].Email || '');

    }
    //}
    var Staff = function (data) {
        this.firstName = ko.observable(data.FirstName || '');
        this.lastName = ko.observable(data.LastName || '');
        this.title = ko.observable(data.Title);
        this.email = ko.observable(data.Email);

        this.name = ko.computed(function () {
            var sTitle = this.title();
            if (sTitle == null) {
                sTitle = this.firstName() + " " + this.lastName();
            }
            return sTitle;
        }, this);
    }

    var OptionItem = function (option) {
        this.option = ko.observable(option);
    }

    var LocationModel = {
        locations: ko.observableArray(),
        //staff: ko.observableArray(),
        options: ko.observableArray(),
        Header: ko.observable(""),
        loadLocations: function (data) {
            this.Header = data.CityName;
            this.locations.removeAll();
            for (var i = 0; i < data.AddressList.length; i++) {
                if (((data.CountryGroup != 1) && (data.CountryGroup != 19)) && (i > 0))
                { }
                else {
                    this.locations.push(new Location(data, i));
                }
            }
        },
        loadOptions: function (data) {
            this.options.removeAll();
            for (var i = 0; i < data.AddressList.length; i++) {
                var location = data.AddressList[i];

                for (var j = 0; j < location.Options.length; j++) {
                    this.options.push(new OptionItem(location.Options[j].Option));
                }
            }
        },

        clearNonCorporateData: function () {
            this.options.removeAll();
            //this.staff.removeAll();
        }

    }

    ko.applyBindings(LocationModel);
    if (getURLParameter('cityCode') == null)
        getStationData('HQ');
    else
        getStationData(getURLParameter('cityCode'));
});

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
}
function sortJSON(data, key) {
    return data.sort(function (a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

"use client";

import { ZoomableChart } from "@/components/chart";
import { useState, useMemo, useEffect } from "react";
import parser from "papaparse";
import { parse, format, isValid } from "date-fns";
import { CalendarDateRangePicker } from "@/components/ui/date-range-picker";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { parseCookies, setCookie } from "nookies";
import { Button } from "@/components/ui/button";
import { features, GOOGLE_SHEETS_CSV_URL, selectedColor } from "@/constants";
import { AuthProps } from "@/types";

export default function ApplicationData({
  setAuthenticated,
  setIsLoginVisible,
  setIsSignupVisible,
}: AuthProps) {
  const searchParams = useSearchParams();

  const cookies = parseCookies();

  const [data, setData] = useState<any[]>([]);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(
    searchParams.get("feature") || cookies.feature || null
  );
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>(
    searchParams.get("age") || cookies.age || "all"
  );
  const [selectedGender, setSelectedGender] = useState<string>(
    searchParams.get("gender") || cookies.gender || "all"
  );

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = searchParams.get("from") || cookies.from || "2022-10-04";
    const to = searchParams.get("to") || cookies.to || "2022-10-29";

    return {
      from: parse(from, "yyyy-MM-dd", new Date()),
      to: parse(to, "yyyy-MM-dd", new Date()),
    };
  });

  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(GOOGLE_SHEETS_CSV_URL);
        const csvData = await response.text();

        const parsedData = parser.parse(csvData, {
          header: true,
          dynamicTyping: true,
        }).data;

        const formattedData = parsedData
          .map((item: any) => {
            let day;

            try {
              const parsedDate = parse(item.Day, "d/M/yyyy", new Date());
              if (isValid(parsedDate)) {
                day = format(parsedDate, "yyyy-MM-dd");
              } else {
                console.warn(`Invalid date: ${item.Day}`);
                day = null;
              }
            } catch (error) {
              console.error(`Error parsing date: ${item.Day}`, error);
              day = null;
            }
            return { ...item, day };
          })
          .filter((item) => item.day !== null);

        setData(formattedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    })();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const itemDate = new Date(item.day);

      const isWithinDateRange = () => {
        return (
          isValid(itemDate) &&
          itemDate >= (dateRange?.from ?? new Date(0)) &&
          itemDate <= (dateRange?.to ?? new Date())
        );
      };

      const isMatchingAgeGroup = () => {
        return selectedAgeGroup === "all" || item.Age === selectedAgeGroup;
      };

      const isMatchingGender = () => {
        return selectedGender === "all" || item.Gender === selectedGender;
      };

      return isWithinDateRange() && isMatchingAgeGroup() && isMatchingGender();
    });
  }, [data, dateRange, selectedAgeGroup, selectedGender]);

  const barChartData = useMemo(() => {
    return features
      .map((feature) => ({
        name: feature,
        total: filteredData.reduce(
          (sum, item) => sum + (item[feature] as number),
          0
        ),
        fill: feature === selectedFeature ? selectedColor : "#8884d8",
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData, selectedFeature]);

  const timeSeriesData = useMemo(() => {
    if (!selectedFeature) {
      return [];
    }

    return filteredData
      .map((item) => ({
        date: item.day, // Use the day directly without adding time
        events: item[selectedFeature] as number,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredData, selectedFeature]);

  const handleResetPreferences = () => {
    const defaultDateRange = {
      from: new Date("2022-10-04"),
      to: new Date("2022-10-29"),
    };

    setDateRange(defaultDateRange);
    setSelectedFeature(null);
    setSelectedAgeGroup("all");
    setSelectedGender("all");

    // Reset URL parameters
    router.push("/");

    // Reset cookies
    setCookie(null, "from", "2022-10-04", { path: "/" });
    setCookie(null, "to", "2022-10-29", { path: "/" });
    setCookie(null, "feature", "", { path: "/" });
    setCookie(null, "age", "all", { path: "/" });
    setCookie(null, "gender", "all", { path: "/" });
  };

  useEffect(() => {
    const params = new URLSearchParams();

    if (dateRange?.from) {
      const fromDate = format(dateRange?.from, "yyyy-MM-dd");

      params.set("from", fromDate);

      setCookie(null, "from", fromDate, { path: "/" });
    }

    if (dateRange?.to) {
      const toDate = format(dateRange?.to, "yyyy-MM-dd");

      params.set("to", toDate);

      setCookie(null, "to", toDate, { path: "/" });
    }

    if (selectedFeature) {
      params.set("feature", selectedFeature);
      setCookie(null, "feature", selectedFeature, { path: "/" });
    }

    if (selectedAgeGroup) {
      params.set("age", selectedAgeGroup);
      setCookie(null, "age", selectedAgeGroup, { path: "/" });
    }

    if (selectedGender) {
      params.set("gender", selectedGender);
      setCookie(null, "gender", selectedGender, { path: "/" });
    }

    router.push(`?${params.toString()}`);
  }, [dateRange, selectedFeature, selectedAgeGroup, selectedGender, router]);

  const handleBarClick = (data: { name: string }) => {
    setSelectedFeature(data.name);
  };

  const handleDateRangeChange = (newDateRange: typeof dateRange) => {
    setDateRange(newDateRange);
  };

  const onLogout = async () => {
    try {
      setLogoutLoading(true);

      const response = await fetch("/api/logout");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      setAuthenticated(false);
      setIsLoginVisible(true);
      setIsSignupVisible(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLogoutLoading(false);
    }
  };

  const onShare = () => {
    const shareUrl = window.location.href;

    navigator.clipboard.writeText(shareUrl);

    alert("URL copied to clipboard");
  };

  return (
    <main className="space-y-8 m-10">
      <div className="flex sm:flex-row flex-col justify-between gap-10">
        <div className="flex flex-wrap gap-4">
          <CalendarDateRangePicker
            date={dateRange ?? { from: new Date(), to: new Date() }}
            setDate={(date: DateRange | undefined) => {
              if (date?.from && date?.to)
                handleDateRangeChange({ from: date.from, to: date.to });
            }}
          />
          <Select
            value={selectedAgeGroup}
            onValueChange={(value) => setSelectedAgeGroup(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Age Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Age Groups</SelectItem>
              <SelectItem value="15-25">15-25</SelectItem>
              <SelectItem value="&gt;25">&gt;25</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={selectedGender}
            onValueChange={(value) => setSelectedGender(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="default" onClick={handleResetPreferences}>
            Reset Preferences
          </Button>
          <Button variant="default" onClick={onShare}>
            Share
          </Button>
        </div>

        <Button
          className="flex"
          variant="default"
          onClick={onLogout}
          disabled={logoutLoading}
        >
          {logoutLoading ? "Please wait..." : "Logout"}
        </Button>
      </div>
      <div className="grid lg:grid-cols-2 gap-10">
        <Card>
          <CardContent>
            <CardHeader className="mb-10">
              <CardTitle className="text-lg font-semibold mt-5">
                Feature Usage
              </CardTitle>
              <CardDescription>
                Total time spent on each feature
              </CardDescription>
            </CardHeader>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#8884d8" onClick={handleBarClick}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {selectedFeature ? (
          <ZoomableChart data={timeSeriesData} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Time Trend</CardTitle>
              <CardDescription>
                Select a feature to view the time trend
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center">
              <p className="text-lg font-semibold mt-28">
                Please select a feature to view the time trend.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

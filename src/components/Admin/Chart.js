import React, { useState } from 'react';
import { useTheme } from '@material-ui/core/styles';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Title from './Title';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export default function Chart({ activities }) {
  // const [typeOne, setTypeOne] = useState({
  //   name: 'Business Given',
  //   key: 'business_given'
  // })
  const [referrals, setReferrals] = useState(false);
  const [oneToOnes, setOneToOnes] = useState(false);
  const [business, setBusiness] = useState(true);
  const handleChangeReferrals = (event) => {
    setReferrals(event.target.checked);
  };
  const handleChangeOneToOnes = (event) => {
    setOneToOnes(event.target.checked);
  };
  const handleChangeBusiness = (event) => {
    setBusiness(event.target.checked);
  };

  return (
    <React.Fragment>
      <Title>Business Given, Received, Referrals and One to Ones</Title>
      <ResponsiveContainer
        style={{ marginTop: '5em' }}
        width="100%"
        height="100%"
      >
        <BarChart
          width={700}
          height={300}
          data={activities}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="member" />
          <YAxis
            tickFormatter={business ? (value) => currencyFormatter.format(value): undefined}
            dataKey={business ? 'business_received' : "referrals_given"}
          />
          <Tooltip />
          <Legend />
          {business && (
            <Bar
              formatter={(value) => currencyFormatter.format(value)}
              name="Business Given"
              dataKey="business_given"
              fill="#8884d8"
            />
          )}
          {business && (
            <Bar
              formatter={(value) => currencyFormatter.format(value)}
              name="Busines Received"
              dataKey="business_received"
              fill="#82ca9d"
            />
          )}
          {referrals && (
            <Bar
              // formatter={(value) => currencyFormatter.format(value)}
              name="Referrals Given"
              dataKey="referrals_given"
              fill="#84b4d8"
            />
          )}
          {oneToOnes && (
            <Bar
              // formatter={(value) => currencyFormatter.format(value)}
              name="One to Ones"
              dataKey="num_one_to_ones"
              fill="#d884ad"
            />
          )}
        </BarChart>
        {/* <button></button> */}
      </ResponsiveContainer>
      <FormControlLabel
        control={
          <Checkbox
            color="default"
            checked={business}
            onChange={handleChangeBusiness}
          />
        }
        label="Business"
      />
      <FormControlLabel
        control={
          <Checkbox
            color="default"
            checked={referrals}
            onChange={handleChangeReferrals}
          />
        }
        label="Referrals"
      />
      <FormControlLabel
        control={
          <Checkbox
            color="default"
            checked={oneToOnes}
            onChange={handleChangeOneToOnes}
          />
        }
        label="One To Ones"
      />
    </React.Fragment>
  );
}
